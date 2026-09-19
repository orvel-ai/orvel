import type {
  AgentMessage,
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from '@orvel/runtime'

export interface OllamaProviderOptions {
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
}

interface OllamaChatResponse {
  readonly model?: string
  readonly message?: { readonly content?: string }
  readonly prompt_eval_count?: number
  readonly eval_count?: number
  readonly error?: string
}

interface OllamaTagsResponse {
  readonly models?: readonly { readonly name?: string }[]
  readonly error?: string
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

function toOllamaMessage(message: AgentMessage) {
  return { role: message.role, content: message.content }
}

async function readJson(response: Response): Promise<OllamaChatResponse> {
  try {
    return (await response.json()) as OllamaChatResponse
  } catch {
    throw new Error('Ollama returned a malformed JSON response.')
  }
}

function connectionError(error: unknown): Error {
  if (error instanceof Error) {
    return new Error(
      `Could not reach Ollama. Make sure it is installed and running at the configured URL. (${error.message})`,
    )
  }
  return new Error(
    'Could not reach Ollama. Make sure it is installed and running at the configured URL.',
  )
}

export async function listOllamaModels({
  baseUrl = 'http://localhost:11434',
  fetch: fetchImplementation = globalThis.fetch,
}: OllamaProviderOptions = {}): Promise<readonly string[]> {
  let response: Response
  try {
    response = await fetchImplementation(endpoint(baseUrl, '/api/tags'))
  } catch (error) {
    throw connectionError(error)
  }

  let payload: OllamaTagsResponse
  try {
    payload = (await response.json()) as OllamaTagsResponse
  } catch {
    throw new Error(
      'Ollama returned a malformed response while listing models.',
    )
  }
  if (!response.ok) {
    throw new Error(
      payload.error ??
        `Ollama model listing failed with status ${response.status}.`,
    )
  }
  if (!Array.isArray(payload.models)) {
    throw new Error(
      'Ollama returned a malformed response while listing models.',
    )
  }
  return payload.models
    .map((model) => model.name?.trim())
    .filter((name): name is string => Boolean(name))
}

export function createOllamaProvider({
  baseUrl = 'http://localhost:11434',
  fetch: fetchImplementation = globalThis.fetch,
}: OllamaProviderOptions = {}): ModelProvider {
  return {
    id: 'ollama',
    async generate(request: ModelRequest): Promise<ModelResponse> {
      let response: Response
      try {
        response = await fetchImplementation(endpoint(baseUrl, '/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages.map(toOllamaMessage),
            stream: false,
          }),
          ...(request.signal ? { signal: request.signal } : {}),
        })
      } catch (error) {
        throw connectionError(error)
      }

      const payload = await readJson(response)
      if (!response.ok) {
        const detail =
          payload.error ??
          `Ollama generation failed with status ${response.status}.`
        if (
          response.status === 404 ||
          /not found|not installed/i.test(detail)
        ) {
          throw new Error(
            `Ollama model "${request.model}" is not installed or unavailable. Pull it with \`ollama pull ${request.model}\` and try again.`,
          )
        }
        throw new Error(`Ollama generation failed: ${detail}`)
      }

      const content = payload.message?.content?.trim()
      if (!content)
        throw new Error('Ollama returned a response without generated text.')

      return {
        content,
        ...(payload.model ? { model: payload.model } : {}),
        ...(payload.prompt_eval_count !== undefined ||
        payload.eval_count !== undefined
          ? {
              usage: {
                ...(payload.prompt_eval_count !== undefined
                  ? { inputTokens: payload.prompt_eval_count }
                  : {}),
                ...(payload.eval_count !== undefined
                  ? { outputTokens: payload.eval_count }
                  : {}),
              },
            }
          : {}),
      }
    },
  }
}
