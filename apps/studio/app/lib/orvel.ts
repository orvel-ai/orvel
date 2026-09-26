import { join } from 'node:path'

import { createFileStore } from '@orvel/local'
import {
  createGroqProvider,
  createGroqSemanticRelevanceProvider,
} from '@orvel/groq'
import {
  createOllamaEmbeddingProvider,
  createOllamaProvider,
} from '@orvel/ollama'
import { createOpenAIProvider } from '@orvel/openai'
import {
  createHybridTeachingRetriever,
  createOrvelClient,
  createRuntime,
} from '@orvel/sdk'

const dataPath =
  process.env.ORVEL_DATA_PATH ?? join(process.cwd(), '.orvel', 'data.json')
const store = createFileStore(dataPath)
const openAIKey = process.env.OPENAI_API_KEY
const groqKey = process.env.GROQ_API_KEY
const groqRelevanceModel = process.env.GROQ_RELEVANCE_MODEL
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
const ollamaEmbeddingModel = process.env.OLLAMA_EMBEDDING_MODEL
const ollamaProvider = createOllamaProvider(
  ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {},
)
const groqProvider = createGroqProvider(groqKey ? { apiKey: groqKey } : {})
const openAIProvider = createOpenAIProvider(
  openAIKey ? { apiKey: openAIKey } : {},
)
const runtime = createRuntime({
  providers: [ollamaProvider, groqProvider, openAIProvider],
})

const embeddingProvider = ollamaEmbeddingModel
  ? createOllamaEmbeddingProvider({
      model: ollamaEmbeddingModel,
      ...(ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {}),
    })
  : undefined
const semanticRelevanceProvider =
  !embeddingProvider && groqKey
    ? createGroqSemanticRelevanceProvider({
        apiKey: groqKey,
        ...(groqRelevanceModel ? { model: groqRelevanceModel } : {}),
      })
    : undefined

export const orvel = createOrvelClient({
  store,
  runtime,
  ...(embeddingProvider || semanticRelevanceProvider
    ? {
        teachingRetriever: createHybridTeachingRetriever({
          repository: store,
          ...(embeddingProvider ? { embeddingProvider } : {}),
          ...(semanticRelevanceProvider ? { semanticRelevanceProvider } : {}),
        }),
      }
    : {}),
})

export type OllamaAvailability =
  | { readonly available: true; readonly models: readonly string[] }
  | { readonly available: false; readonly error: string }

export async function getOllamaAvailability(): Promise<OllamaAvailability> {
  try {
    return {
      available: true,
      models:
        (await ollamaProvider.listModels?.())?.map((model) => model.id) ?? [],
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Could not reach Ollama.',
    }
  }
}

export type ProviderAvailability = {
  readonly configured: boolean
  readonly models: readonly string[]
  readonly error?: string
}

export async function getProviderAvailability(): Promise<{
  readonly ollama: ProviderAvailability
  readonly groq: ProviderAvailability
  readonly openai: ProviderAvailability
}> {
  const [ollama, groq, openai] = await Promise.all([
    getOllamaAvailability(),
    listProviderModels(groqProvider, Boolean(groqKey), 'Groq'),
    listProviderModels(openAIProvider, Boolean(openAIKey), 'OpenAI'),
  ])

  return {
    ollama: {
      configured: ollama.available,
      models: ollama.available ? ollama.models : [],
      ...(!ollama.available ? { error: ollama.error } : {}),
    },
    groq,
    openai,
  }
}

async function listProviderModels(
  provider: typeof groqProvider,
  configured: boolean,
  label: string,
): Promise<ProviderAvailability> {
  if (!configured) {
    return {
      configured: false,
      models: [],
      error: `${label} is not configured in this Studio workspace.`,
    }
  }
  try {
    const models = await provider.listModels?.()
    return { configured: true, models: models?.map((model) => model.id) ?? [] }
  } catch (error) {
    return {
      configured: true,
      models: [],
      error:
        error instanceof Error
          ? error.message
          : `Could not list ${label} models.`,
    }
  }
}

export function isProviderConfigured(provider: string): boolean {
  return (
    provider === 'ollama' ||
    (provider === 'groq' && Boolean(groqKey)) ||
    (provider === 'openai' && Boolean(openAIKey))
  )
}
