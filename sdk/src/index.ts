import {
  createContainsEvaluator,
  type EvalCase,
  type EvalRepository,
  type EvalRun,
} from '@orvel/evals'
import {
  createAgent as createAgentDefinition,
  type AgentDefinition,
  type AgentMessage,
  type AgentRepository,
  type AgentRuntime,
  type Conversation,
  type ConversationMessage,
  type ConversationRepository,
  type CreateAgentInput,
  type UpdateAgentInput,
  updateAgent as updateAgentDefinition,
} from '@orvel/runtime'
import {
  createKeywordTeachingRetriever,
  createTeaching,
  createTeachingContext,
  type CreateTeachingInput,
  type TeachingExample,
  type TeachingRepository,
  type TeachingRetriever,
} from '@orvel/training'

export * from '@orvel/evals'
export * from '@orvel/runtime'
export * from '@orvel/training'
export type {
  KnowledgeChunk,
  KnowledgeQuery,
  KnowledgeSource,
} from '@orvel/knowledge'
export type { MemoryQuery, MemoryRecord, MemoryStore } from '@orvel/memory'
export type { Skill, SkillContext } from '@orvel/skills'

export interface OrvelStore
  extends
    AgentRepository,
    ConversationRepository,
    TeachingRepository,
    EvalRepository {}

export interface OrvelClientOptions {
  readonly store: OrvelStore
  readonly runtime: AgentRuntime
  readonly teachingRetriever?: TeachingRetriever
  readonly createId?: () => string
  readonly now?: () => Date
}

export interface SendMessageInput {
  readonly conversationId: string
  readonly content: string
}

export interface SendMessageResult {
  readonly message: ConversationMessage
  readonly teachingIds: readonly string[]
}

export interface RunEvalResult {
  readonly run: EvalRun
}

export interface OrvelClient {
  createAgent(input: CreateAgentInput): Promise<AgentDefinition>
  updateAgent(id: string, input: UpdateAgentInput): Promise<AgentDefinition>
  getAgent(id: string): Promise<AgentDefinition | undefined>
  listAgents(): Promise<readonly AgentDefinition[]>
  createConversation(agentId: string): Promise<Conversation>
  renameConversation(id: string, title: string): Promise<Conversation>
  getConversation(id: string): Promise<Conversation | undefined>
  listConversations(agentId: string): Promise<readonly Conversation[]>
  listMessages(conversationId: string): Promise<readonly ConversationMessage[]>
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>
  saveTeaching(input: CreateTeachingInput): Promise<TeachingExample>
  listTeachings(agentId: string): Promise<readonly TeachingExample[]>
  deleteTeaching(id: string): Promise<void>
  createEval(input: {
    readonly agentId: string
    readonly input: string
    readonly expected: string
  }): Promise<EvalCase>
  listEvals(agentId: string): Promise<readonly EvalCase[]>
  runEval(evalId: string): Promise<RunEvalResult>
  listEvalRuns(agentId: string): Promise<readonly EvalRun[]>
}

export function createOrvelClient({
  store,
  runtime,
  teachingRetriever = createKeywordTeachingRetriever({ repository: store }),
  createId = () => crypto.randomUUID(),
  now = () => new Date(),
}: OrvelClientOptions): OrvelClient {
  async function requireAgent(id: string): Promise<AgentDefinition> {
    const agent = await store.getAgent(id)
    if (!agent) throw new Error('Agent not found.')
    return agent
  }

  async function runForAgent(
    agent: AgentDefinition,
    messages: readonly AgentMessage[],
  ) {
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user')
    const matches = latestUserMessage
      ? await teachingRetriever.retrieve(agent.id, latestUserMessage.content)
      : []
    const result = await runtime.run(agent, {
      messages,
      context: createTeachingContext(matches),
    })
    return { result, teachingIds: matches.map((match) => match.teaching.id) }
  }

  return {
    async createAgent(input) {
      const agent = createAgentDefinition(input, { id: createId(), now: now() })
      await store.createAgent(agent)
      return agent
    },
    async updateAgent(id, input) {
      const existing = await requireAgent(id)
      const agent = updateAgentDefinition(existing, input, { now: now() })
      if (!store.updateAgent) {
        throw new Error('This store does not support updating agents.')
      }
      await store.updateAgent(agent)
      return agent
    },
    getAgent: (id) => store.getAgent(id),
    listAgents: () => store.listAgents(),
    async createConversation(agentId) {
      await requireAgent(agentId)
      const timestamp = now()
      const conversation = {
        id: createId(),
        agentId,
        title: 'New conversation',
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await store.createConversation(conversation)
      return conversation
    },
    async renameConversation(id, title) {
      const conversation = await store.getConversation(id)
      if (!conversation) throw new Error('Conversation not found.')
      const name = title.trim()
      if (!name) throw new Error('A conversation name is required.')
      if (name.length > 120) {
        throw new Error('A conversation name cannot exceed 120 characters.')
      }
      if (!store.updateConversation) {
        throw new Error('This store does not support renaming conversations.')
      }
      const renamed = { ...conversation, title: name, updatedAt: now() }
      await store.updateConversation(renamed)
      return renamed
    },
    getConversation: (id) => store.getConversation(id),
    listConversations: (agentId) => store.listConversations(agentId),
    listMessages: (conversationId) => store.listMessages(conversationId),
    async sendMessage({ conversationId, content }) {
      const text = content.trim()
      if (!text) throw new Error('A message is required.')

      const conversation = await store.getConversation(conversationId)
      if (!conversation) throw new Error('Conversation not found.')
      const agent = await requireAgent(conversation.agentId)
      const userMessage: ConversationMessage = {
        id: createId(),
        conversationId,
        role: 'user',
        content: text,
        createdAt: now(),
      }
      await store.appendMessage(userMessage)

      const history = await store.listMessages(conversationId)
      const { result, teachingIds } = await runForAgent(agent, history)
      const assistantMessage: ConversationMessage = {
        id: createId(),
        conversationId,
        role: 'assistant',
        content: result.response.content,
        ...(teachingIds.length > 0 ? { teachingIds } : {}),
        createdAt: now(),
      }
      await store.appendMessage(assistantMessage)
      return { message: assistantMessage, teachingIds }
    },
    async saveTeaching(input) {
      await requireAgent(input.agentId)
      const teaching = createTeaching(input, { id: createId(), now: now() })
      await store.createTeaching(teaching)
      return teaching
    },
    listTeachings: (agentId) => store.listTeachings(agentId),
    deleteTeaching: (id) => store.deleteTeaching(id),
    async createEval(input) {
      await requireAgent(input.agentId)
      const evalCase: EvalCase = {
        id: createId(),
        agentId: input.agentId,
        input: input.input.trim(),
        expected: input.expected.trim(),
        createdAt: now(),
      }
      if (!evalCase.input || !evalCase.expected) {
        throw new Error('An eval requires input and expected behavior.')
      }
      await store.createEval(evalCase)
      return evalCase
    },
    listEvals: (agentId) => store.listEvals(agentId),
    async runEval(evalId) {
      const allAgents = await store.listAgents()
      const evalCase = (
        await Promise.all(allAgents.map((agent) => store.listEvals(agent.id)))
      )
        .flat()
        .find((candidate) => candidate.id === evalId)
      if (!evalCase) throw new Error('Eval not found.')

      const agent = await requireAgent(evalCase.agentId)
      const { result, teachingIds } = await runForAgent(agent, [
        { role: 'user', content: evalCase.input },
      ])
      const evaluation = await createContainsEvaluator().evaluate(
        result.response.content,
        evalCase.expected,
      )
      const run: EvalRun = {
        id: createId(),
        evalId: evalCase.id,
        agentId: agent.id,
        input: evalCase.input,
        expected: evalCase.expected,
        actual: result.response.content,
        result: evaluation,
        teachingIds,
        createdAt: now(),
      }
      await store.createEvalRun(run)
      return { run }
    },
    listEvalRuns: (agentId) => store.listEvalRuns(agentId),
  }
}
