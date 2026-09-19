import { join } from 'node:path'

import { createFileStore } from '@orvel/local'
import { createOllamaProvider, listOllamaModels } from '@orvel/ollama'
import { createOpenAIProvider } from '@orvel/openai'
import { createOrvelClient, createRuntime } from '@orvel/sdk'

const dataPath =
  process.env.ORVEL_DATA_PATH ?? join(process.cwd(), '.orvel', 'data.json')
const store = createFileStore(dataPath)
const openAIKey = process.env.OPENAI_API_KEY
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
const runtime = createRuntime({
  providers: [
    createOllamaProvider(ollamaBaseUrl ? { baseUrl: ollamaBaseUrl } : {}),
    createOpenAIProvider(openAIKey ? { apiKey: openAIKey } : {}),
  ],
})

export const orvel = createOrvelClient({ store, runtime })

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
  return provider === 'ollama' || (provider === 'openai' && Boolean(openAIKey))
}
