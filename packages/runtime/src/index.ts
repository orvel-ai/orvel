export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface AgentMessage {
  readonly role: AgentMessageRole
  readonly content: string
  readonly name?: string
}

export interface ModelUsage {
  readonly inputTokens?: number
  readonly outputTokens?: number
}

export interface ModelRequest {
  readonly model: string
  readonly messages: readonly AgentMessage[]
  readonly maxOutputTokens?: number
  readonly temperature?: number
  readonly signal?: AbortSignal
}

export interface ModelResponse {
  readonly content: string
  readonly model?: string
  readonly usage?: ModelUsage
}

export interface ModelProvider {
  readonly id: string
  generate(request: ModelRequest): Promise<ModelResponse>
}

export interface AgentDefinition {
  readonly id: string
  readonly name: string
  readonly instructions: string
  readonly brain: {
    readonly provider: string
    readonly model: string
  }
}

export interface AgentRunInput {
  readonly messages: readonly AgentMessage[]
  readonly signal?: AbortSignal
}

export interface AgentRuntime {
  run(agent: AgentDefinition, input: AgentRunInput): Promise<ModelResponse>
}

export interface RuntimeOptions {
  readonly providers: readonly ModelProvider[]
}

export function createRuntime({ providers }: RuntimeOptions): AgentRuntime {
  const providersById = new Map<string, ModelProvider>()

  for (const provider of providers) {
    if (providersById.has(provider.id)) {
      throw new Error(
        `A model provider with id "${provider.id}" is already registered.`,
      )
    }

    providersById.set(provider.id, provider)
  }

  return {
    async run(agent, input) {
      const provider = providersById.get(agent.brain.provider)

      if (!provider) {
        throw new Error(
          `Model provider "${agent.brain.provider}" is not registered.`,
        )
      }

      return provider.generate({
        model: agent.brain.model,
        messages: [
          { role: 'system', content: agent.instructions },
          ...input.messages,
        ],
        ...(input.signal ? { signal: input.signal } : {}),
      })
    },
  }
}
