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
import {
  KNOWLEDGE_TEXT_MAX_LENGTH,
  KNOWLEDGE_LINK_MAX_LENGTH,
  type KnowledgeEntry,
  type KnowledgeRepository,
  type KnowledgeTextInput,
  type KnowledgeLinkInput,
} from '@orvel/knowledge'

export * from '@orvel/evals'
export * from '@orvel/runtime'
export * from '@orvel/training'
export type {
  KnowledgeEntry,
  KnowledgeChunk,
  KnowledgeQuery,
  KnowledgeRepository,
  KnowledgeSource,
  KnowledgeTextInput,
  KnowledgeLinkInput,
} from '@orvel/knowledge'
export type { MemoryQuery, MemoryRecord, MemoryStore } from '@orvel/memory'
export type { Skill, SkillContext } from '@orvel/skills'

export interface OrvelStore
  extends
    AgentRepository,
    ConversationRepository,
    TeachingRepository,
    EvalRepository,
    Partial<KnowledgeRepository> {}

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
  deleteAgent(id: string): Promise<void>
  getAgent(id: string): Promise<AgentDefinition | undefined>
  listAgents(): Promise<readonly AgentDefinition[]>
  createConversation(agentId: string): Promise<Conversation>
  deleteConversation(id: string, agentId: string): Promise<void>
  renameConversation(id: string, agentId: string, title: string): Promise<void>
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
  addKnowledgeText(input: KnowledgeTextInput): Promise<KnowledgeEntry>
  addKnowledgeLink(input: KnowledgeLinkInput): Promise<KnowledgeEntry>
  listKnowledge(agentId: string): Promise<readonly KnowledgeEntry[]>
  deleteKnowledge(id: string, agentId: string): Promise<void>
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
    const knowledge =
      latestUserMessage && store.listKnowledgeEntries
        ? await store.listKnowledgeEntries(agent.id)
        : []
    const queryTerms = new Set(
      latestUserMessage?.content.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ??
        [],
    )
    const relevantKnowledge = knowledge
      .map((entry) => ({
        entry,
        score:
          (entry.title + ' ' + entry.content)
            .toLowerCase()
            .match(/[\p{L}\p{N}]{3,}/gu)
            ?.filter((term) => queryTerms.has(term)).length ?? 0,
      }))
      .filter((match) => match.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
    const startedAt = Date.now()
    const result = await runtime.run(agent, {
      messages,
      context: [
        ...relevantKnowledge.map(({ entry }) => ({
          id: entry.id,
          label: `Knowledge: ${entry.title}`,
          content: entry.content,
        })),
        ...createTeachingContext(matches),
      ],
    })
    return {
      result,
      teachingIds: matches.map((match) => match.teaching.id),
      knowledgeSources: relevantKnowledge.map(({ entry }) => ({
        id: entry.id,
        title: entry.title,
      })),
      feedbackExamples: matches.map(({ teaching }) => ({
        id: teaching.id,
        userInput: teaching.userInput,
      })),
      durationMs: Date.now() - startedAt,
      usedQuickFacts: Boolean(agent.generalKnowledge?.trim()),
    }
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
    async deleteAgent(id) {
      await requireAgent(id)
      if (!store.deleteAgent) {
        throw new Error('This store does not support deleting agents.')
      }
      await store.deleteAgent(id)
    },
    getAgent: (id) => store.getAgent(id),
    listAgents: () => store.listAgents(),
    async createConversation(agentId) {
      await requireAgent(agentId)
      const timestamp = now()
      const conversation = {
        id: createId(),
        agentId,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await store.createConversation(conversation)
      return conversation
    },
    async deleteConversation(id, agentId) {
      await requireAgent(agentId)
      if (!store.deleteConversation) {
        throw new Error('This store does not support deleting conversations.')
      }
      const conversation = await store.getConversation(id)
      if (!conversation || conversation.agentId !== agentId) {
        throw new Error('Conversation not found for this agent.')
      }
      await store.deleteConversation(id)
    },
    async renameConversation(id, agentId, title) {
      await requireAgent(agentId)
      if (!store.updateConversation) {
        throw new Error('This store does not support renaming conversations.')
      }
      const conversation = await store.getConversation(id)
      if (!conversation || conversation.agentId !== agentId) {
        throw new Error('Conversation not found for this agent.')
      }
      const normalizedTitle = title.trim()
      if (!normalizedTitle) throw new Error('A conversation title is required.')
      if (normalizedTitle.length > 120) {
        throw new Error('Conversation titles cannot exceed 120 characters.')
      }
      await store.updateConversation({
        ...conversation,
        title: normalizedTitle,
      })
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
      const {
        result,
        teachingIds,
        knowledgeSources,
        feedbackExamples,
        durationMs,
        usedQuickFacts,
      } = await runForAgent(agent, history)
      const assistantMessage: ConversationMessage = {
        id: createId(),
        conversationId,
        role: 'assistant',
        content: result.response.content,
        ...(teachingIds.length > 0 ? { teachingIds } : {}),
        execution: {
          provider: agent.brain.provider,
          model: result.response.model ?? agent.brain.model,
          durationMs,
          ...(result.response.usage ? { usage: result.response.usage } : {}),
          knowledgeSources,
          feedbackExamples,
          usedQuickFacts,
        },
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
    async addKnowledgeText(input) {
      if (!store.createKnowledgeEntry) {
        throw new Error('This store does not support agent knowledge yet.')
      }
      await requireAgent(input.agentId)
      const title = input.title.trim()
      const content = input.content.trim()
      if (!title || !content) {
        throw new Error('A title and knowledge text are required.')
      }
      if (content.length > KNOWLEDGE_TEXT_MAX_LENGTH) {
        throw new Error('Knowledge text cannot exceed 20,000 characters.')
      }
      const entry: KnowledgeEntry = {
        id: createId(),
        agentId: input.agentId,
        title,
        content,
        createdAt: now(),
      }
      await store.createKnowledgeEntry(entry)
      return entry
    },
    async addKnowledgeLink(input) {
      let url: URL
      try {
        url = new URL(input.url.trim())
      } catch {
        throw new Error('Enter a valid HTTP or HTTPS URL.')
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Knowledge URLs must use HTTP or HTTPS.')
      }
      if (url.href.length > KNOWLEDGE_LINK_MAX_LENGTH) {
        throw new Error('Knowledge URLs cannot exceed 2,000 characters.')
      }
      if (url.username || url.password) {
        throw new Error('Knowledge URLs cannot include credentials.')
      }
      if (!store.createKnowledgeEntry) {
        throw new Error('This store does not support agent knowledge yet.')
      }
      await requireAgent(input.agentId)
      const entry: KnowledgeEntry = {
        id: createId(),
        agentId: input.agentId,
        title: url.hostname + url.pathname.replace(/\/$/, ''),
        content: '',
        sourceUrl: url.href,
        createdAt: now(),
      }
      await store.createKnowledgeEntry(entry)
      return entry
    },
    async listKnowledge(agentId) {
      if (!store.listKnowledgeEntries) return []
      await requireAgent(agentId)
      return store.listKnowledgeEntries(agentId)
    },
    async deleteKnowledge(id, agentId) {
      if (!store.deleteKnowledgeEntry) {
        throw new Error('This store does not support agent knowledge yet.')
      }
      const entries = await store.listKnowledgeEntries?.(agentId)
      if (!entries?.some((entry) => entry.id === id)) {
        throw new Error('Knowledge entry not found for this agent.')
      }
      await store.deleteKnowledgeEntry(id)
    },
  }
}
