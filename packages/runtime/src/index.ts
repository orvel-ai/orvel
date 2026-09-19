export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface AgentMessage {
  readonly role: AgentMessageRole
  readonly content: string
  readonly name?: string
}

export interface ModelConfig {
  readonly provider: string
  readonly model: string
  readonly settings?: Readonly<Record<string, unknown>>
}

export interface AgentDefinition {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly instructions: string
  readonly brain: ModelConfig
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateAgentInput {
  readonly name: string
  readonly description?: string
  readonly instructions: string
  readonly model: ModelConfig
}

export interface Conversation {
  readonly id: string
  readonly agentId: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface ConversationMessage extends AgentMessage {
  readonly id: string
  readonly conversationId: string
  readonly createdAt: Date
  readonly teachingIds?: readonly string[]
}

export interface ModelUsage {
  readonly inputTokens?: number
  readonly outputTokens?: number
}

export interface RuntimeContext {
  readonly id: string
  readonly label: string
  readonly content: string
}

export interface ModelRequest {
  readonly model: string
  readonly instructions: string
  readonly context: readonly RuntimeContext[]
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

export interface AgentRunInput {
  readonly messages: readonly AgentMessage[]
  readonly context?: readonly RuntimeContext[]
  readonly signal?: AbortSignal
}

export interface AgentRunResult {
  readonly response: ModelResponse
  readonly context: readonly RuntimeContext[]
}

export interface AgentRuntime {
  run(agent: AgentDefinition, input: AgentRunInput): Promise<AgentRunResult>
}

export interface RuntimeOptions {
  readonly providers: readonly ModelProvider[]
}

export interface AgentRepository {
  createAgent(agent: AgentDefinition): Promise<void>
  getAgent(id: string): Promise<AgentDefinition | undefined>
  listAgents(): Promise<readonly AgentDefinition[]>
}

export interface ConversationRepository {
  createConversation(conversation: Conversation): Promise<void>
  getConversation(id: string): Promise<Conversation | undefined>
  listConversations(agentId: string): Promise<readonly Conversation[]>
  appendMessage(message: ConversationMessage): Promise<void>
  listMessages(conversationId: string): Promise<readonly ConversationMessage[]>
}

export function createAgent(
  input: CreateAgentInput,
  options: { readonly id: string; readonly now?: Date },
): AgentDefinition {
  const name = input.name.trim()
  const instructions = input.instructions.trim()
  const provider = input.model.provider.trim()
  const model = input.model.model.trim()

  if (!name) throw new Error('An agent name is required.')
  if (!instructions) throw new Error('Agent instructions are required.')
  if (!provider || !model)
    throw new Error('A model provider and model are required.')

  const now = options.now ?? new Date()
  const description = input.description?.trim()

  return {
    id: options.id,
    name,
    ...(description ? { description } : {}),
    instructions,
    brain: {
      provider,
      model,
      ...(input.model.settings ? { settings: input.model.settings } : {}),
    },
    createdAt: now,
    updatedAt: now,
  }
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

      const context = input.context ?? []
      const response = await provider.generate({
        model: agent.brain.model,
        instructions: agent.instructions,
        context,
        messages: [
          { role: 'system', content: agent.instructions },
          ...context.map((item) => ({
            role: 'system' as const,
            content: `[${item.label}]\n${item.content}`,
          })),
          ...input.messages,
        ],
        ...(input.signal ? { signal: input.signal } : {}),
      })

      return { response, context }
    },
  }
}
