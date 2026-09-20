import type {
  AgentMessage,
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from '@orvel/runtime'

export interface GroqProviderOptions {
  readonly apiKey?: string
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
}

interface GroqResponse {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string | null }
  }[]
  readonly model?: string
  readonly usage?: {
    readonly prompt_tokens?: number
    readonly completion_tokens?: number
  }
  readonly error?: { readonly message?: string; readonly code?: string }
}

function toGroqMessage(message: AgentMessage) {
  return { role: message.role, content: message.content }
}

async function readJson(response: Response): Promise<GroqResponse> {
  try {
    return (await response.json()) as GroqResponse
  } catch {
    throw new Error('Groq returned a malformed JSON response.')
  }
}

function connectionError(error: unknown): Error {
  void error
  return new Error(
    'Could not reach Groq. Check your network connection and try again.',
  )
}

function errorFor(
  response: Response,
  payload: GroqResponse,
  model: string,
): Error {
  const detail =
    payload.error?.message ?? `request failed with status ${response.status}.`

  if (response.status === 401 || response.status === 403) {
    return new Error(
      'Groq authentication failed. Check GROQ_API_KEY and try again.',
    )
  }
  if (response.status === 429) {
    return new Error('Groq rate limit reached. Wait before trying again.')
  }
  if (
    response.status === 404 ||
    /model|decommissioned|unsupported|not found/i.test(detail)
  ) {
    return new Error(
      `Groq model "${model}" is unavailable. Choose an active Groq model and try again.`,
    )
  }
  return new Error(`Groq generation failed: ${detail}`)
}

export function createGroqProvider({
  apiKey,
  baseUrl = 'https://api.groq.com/openai/v1',
  fetch: fetchImplementation = globalThis.fetch,
}: GroqProviderOptions): ModelProvider {
  return {
    id: 'groq',
    async generate(request: ModelRequest): Promise<ModelResponse> {
      if (!apiKey) {
        throw new Error(
          'Groq is not configured. Add GROQ_API_KEY to your environment and restart Studio.',
        )
      }

      let response: Response
      try {
        response = await fetchImplementation(
          `${baseUrl.replace(/\/$/, '')}/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: request.model,
              messages: request.messages.map(toGroqMessage),
              ...(request.maxOutputTokens
                ? { max_completion_tokens: request.maxOutputTokens }
                : {}),
              ...(request.temperature !== undefined
                ? { temperature: request.temperature }
                : {}),
            }),
            ...(request.signal ? { signal: request.signal } : {}),
          },
        )
      } catch (error) {
        throw connectionError(error)
      }

      const payload = await readJson(response)
      if (!response.ok) throw errorFor(response, payload, request.model)

      const content = payload.choices?.[0]?.message?.content?.trim()
      if (!content)
        throw new Error('Groq returned a response without generated text.')

      return {
        content,
        ...(payload.model ? { model: payload.model } : {}),
        ...(payload.usage
          ? {
              usage: {
                ...(payload.usage.prompt_tokens !== undefined
                  ? { inputTokens: payload.usage.prompt_tokens }
                  : {}),
                ...(payload.usage.completion_tokens !== undefined
                  ? { outputTokens: payload.usage.completion_tokens }
                  : {}),
              },
            }
          : {}),
      }
    },
  }
}
