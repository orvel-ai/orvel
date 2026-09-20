import { join } from 'node:path'

import { createFileStore } from '@orvel/local'
import { createGroqProvider } from '@orvel/groq'
import {
  createOllamaEmbeddingProvider,
  createOllamaProvider,
  listOllamaModels,
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
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
const ollamaEmbeddingModel = process.env.OLLAMA_EMBEDDING_MODEL
const runtime = createRuntime({
  providers: [
    createOllamaProvider(ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {}),
    createGroqProvider(groqKey ? { apiKey: groqKey } : {}),
    createOpenAIProvider(openAIKey ? { apiKey: openAIKey } : {}),
  ],
})

const embeddingProvider = ollamaEmbeddingModel
  ? createOllamaEmbeddingProvider({
      model: ollamaEmbeddingModel,
      ...(ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {}),
    })
  : undefined

export const orvel = createOrvelClient({
  store,
  runtime,
  ...(embeddingProvider
    ? {
        teachingRetriever: createHybridTeachingRetriever({
          repository: store,
          embeddingProvider,
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
      models: await listOllamaModels(
        ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {},
      ),
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Could not reach Ollama.',
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
