import type {
  AgentMessage,
  ModelInfo,
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from '@orvel/runtime'

export interface OpenAIProviderOptions {
  readonly apiKey?: string
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
}

interface OpenAIResponse {
  readonly data?: readonly { readonly id?: string }[]
  readonly output_text?: string
  readonly output?: readonly {
    readonly content?: readonly {
      readonly text?: string
      readonly type?: string
    }[]
  }[]
  readonly model?: string
  readonly usage?: {
    readonly input_tokens?: number
    readonly output_tokens?: number
  }
  readonly error?: { readonly message?: string }
}

function toOpenAIMessage(message: AgentMessage) {
  return {
    role:
      message.role === 'system'
        ? 'developer'
        : message.role === 'tool'
          ? 'user'
          : message.role,
    content: [{ type: 'input_text', text: message.content }],
  }
}

function responseText(response: OpenAIResponse): string {
  if (response.output_text) return response.output_text

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' || item.type === 'text')
    .map((item) => item.text ?? '')
    .join('')
}

export function createOpenAIProvider({
  apiKey,
  baseUrl = 'https://api.openai.com/v1',
  fetch: fetchImplementation = globalThis.fetch,
}: OpenAIProviderOptions): ModelProvider {
  return {
    id: 'openai',
    capabilities: {
      modelDiscovery: true,
      streaming: false,
      tools: false,
      vision: false,
      structuredOutput: false,
    },
    async listModels(): Promise<readonly ModelInfo[]> {
      if (!apiKey) {
        throw new Error('OpenAI is not configured for model discovery.')
      }
      let response: Response
      try {
        response = await fetchImplementation(
          `${baseUrl.replace(/\/$/, '')}/models`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        )
      } catch {
        throw new Error('Could not reach OpenAI to list models.')
      }
      let payload: OpenAIResponse
      try {
        payload = (await response.json()) as OpenAIResponse
      } catch {
        throw new Error('OpenAI returned a malformed model list.')
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('OpenAI rejected the configured credentials.')
        }
        throw new Error(
          `OpenAI model listing failed with status ${response.status}.`,
        )
      }
      if (!Array.isArray(payload.data)) {
        throw new Error('OpenAI returned a malformed model list.')
      }
      const unsupported =
        /embed|tts|transcri|whisper|image|moderation|realtime|computer-use|search-preview/i
      return payload.data
        .map((model) => model.id?.trim())
        .filter(
          (id): id is string =>
            Boolean(id) &&
            /^(gpt-|o[134](?:-|$))/.test(id) &&
            !unsupported.test(id),
        )
        .sort((left, right) => left.localeCompare(right))
        .map((id) => ({ id }))
    },
    async generate(request: ModelRequest): Promise<ModelResponse> {
      if (!apiKey) {
        throw new Error(
          'OpenAI is not configured. Add OPENAI_API_KEY to your environment and restart Studio.',
        )
      }

      const response = await fetchImplementation(
        `${baseUrl.replace(/\/$/, '')}/responses`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: request.model,
            input: request.messages.map(toOpenAIMessage),
          }),
          ...(request.signal ? { signal: request.signal } : {}),
        },
      )

      const payload = (await response.json()) as OpenAIResponse
      if (!response.ok) {
        throw new Error(
          payload.error?.message ??
            `OpenAI request failed with status ${response.status}.`,
        )
      }

      const content = responseText(payload)
      if (!content)
        throw new Error('OpenAI returned a response without text output.')

      return {
        content,
        ...(payload.model ? { model: payload.model } : {}),
        ...(payload.usage
          ? {
              usage: {
                ...(payload.usage.input_tokens !== undefined
                  ? { inputTokens: payload.usage.input_tokens }
                  : {}),
                ...(payload.usage.output_tokens !== undefined
                  ? { outputTokens: payload.usage.output_tokens }
                  : {}),
              },
            }
          : {}),
      }
    },
  }
}
