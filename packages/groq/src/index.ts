import type {
  AgentMessage,
  ModelInfo,
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from '@orvel/runtime'
import type {
  SemanticRelevanceInput,
  SemanticRelevanceProvider,
  SemanticRelevanceResult,
} from '@orvel/training'

export interface GroqProviderOptions {
  readonly apiKey?: string
  readonly baseUrl?: string
  readonly fetch?: typeof globalThis.fetch
}

export interface GroqSemanticRelevanceProviderOptions extends GroqProviderOptions {
  readonly model?: string
}

interface GroqResponse {
  readonly data?: readonly {
    readonly id?: string
    readonly active?: boolean
    readonly architecture?: {
      readonly input_modalities?: readonly string[]
      readonly output_modalities?: readonly string[]
    }
  }[]
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
    capabilities: {
      modelDiscovery: true,
      streaming: false,
      tools: false,
      vision: false,
      structuredOutput: false,
    },
    async listModels(): Promise<readonly ModelInfo[]> {
      if (!apiKey) {
        throw new Error('Groq is not configured for model discovery.')
      }
      let response: Response
      try {
        response = await fetchImplementation(
          `${baseUrl.replace(/\/$/, '')}/models`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        )
      } catch {
        throw new Error('Could not reach Groq to list models.')
      }
      const payload = await readJson(response)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Groq rejected the configured credentials.')
        }
        throw new Error(
          `Groq model listing failed with status ${response.status}.`,
        )
      }
      if (!Array.isArray(payload.data)) {
        throw new Error('Groq returned a malformed model list.')
      }
      return payload.data
        .filter(
          (model) =>
            model.active !== false &&
            (!model.architecture?.input_modalities ||
              model.architecture.input_modalities.includes('text')) &&
            (!model.architecture?.output_modalities ||
              model.architecture.output_modalities.includes('text')) &&
            !/whisper|embed/i.test(model.id ?? ''),
        )
        .map((model) => model.id?.trim())
        .filter((id): id is string => Boolean(id))
        .sort((left, right) => left.localeCompare(right))
        .map((id) => ({ id }))
    },
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

export function createGroqSemanticRelevanceProvider({
  apiKey,
  model = 'openai/gpt-oss-20b',
  baseUrl = 'https://api.groq.com/openai/v1',
  fetch: fetchImplementation = globalThis.fetch,
}: GroqSemanticRelevanceProviderOptions): SemanticRelevanceProvider {
  return {
    id: `groq:${model}`,
    async judge(
      input: SemanticRelevanceInput,
    ): Promise<SemanticRelevanceResult> {
      if (!apiKey) {
        throw new Error(
          'Groq is not configured. Add GROQ_API_KEY to your environment.',
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
              model,
              temperature: 0,
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'system',
                  content:
                    'Classify whether a stored teaching would be useful for the new user message. Do not answer the user. Return only JSON with boolean relevant and number confidence from 0 to 1.',
                },
                {
                  role: 'user',
                  content: JSON.stringify({
                    newUserMessage: input.query,
                    teaching: {
                      userInput: input.teaching.userInput,
                      correctedResponse: input.teaching.correctedResponse,
                      explanation: input.teaching.explanation,
                    },
                  }),
                },
              ],
            }),
          },
        )
      } catch {
        throw new Error('Could not reach Groq for semantic teaching retrieval.')
      }
      const payload = await readJson(response)
      if (!response.ok) throw errorFor(response, payload, model)
      const content = payload.choices?.[0]?.message?.content
      if (!content)
        throw new Error('Groq returned no semantic relevance result.')
      let result: unknown
      try {
        result = JSON.parse(content)
      } catch {
        throw new Error('Groq returned malformed semantic relevance JSON.')
      }
      if (
        typeof result !== 'object' ||
        result === null ||
        typeof (result as { relevant?: unknown }).relevant !== 'boolean' ||
        typeof (result as { confidence?: unknown }).confidence !== 'number' ||
        !Number.isFinite((result as { confidence: number }).confidence) ||
        (result as { confidence: number }).confidence < 0 ||
        (result as { confidence: number }).confidence > 1
      ) {
        throw new Error('Groq returned malformed semantic relevance JSON.')
      }
      return {
        relevant: (result as { relevant: boolean }).relevant,
        confidence: (result as { confidence: number }).confidence,
      }
    },
  }
}
