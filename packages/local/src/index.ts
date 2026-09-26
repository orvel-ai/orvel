import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import type { EvalCase, EvalRepository, EvalRun } from '@orvel/evals'
import type {
  AgentDefinition,
  AgentRepository,
  Conversation,
  ConversationMessage,
  ConversationRepository,
} from '@orvel/runtime'
import type {
  TeachingEmbedding,
  TeachingExample,
  TeachingRepository,
} from '@orvel/training'

interface KnowledgeEntry {
  readonly id: string
  readonly agentId: string
  readonly title: string
  readonly content: string
  readonly sourceUrl?: string
  readonly createdAt: Date
}

interface KnowledgeRepository {
  createKnowledgeEntry(entry: KnowledgeEntry): Promise<void>
  listKnowledgeEntries(agentId: string): Promise<readonly KnowledgeEntry[]>
  deleteKnowledgeEntry(id: string): Promise<void>
}

interface SerializedAgent extends Omit<
  AgentDefinition,
  'createdAt' | 'updatedAt'
> {
  readonly createdAt: string
  readonly updatedAt: string
}

interface SerializedConversation extends Omit<
  Conversation,
  'createdAt' | 'updatedAt'
> {
  readonly createdAt: string
  readonly updatedAt: string
}

interface SerializedMessage extends Omit<ConversationMessage, 'createdAt'> {
  readonly createdAt: string
}

interface SerializedTeaching extends Omit<TeachingExample, 'createdAt'> {
  readonly createdAt: string
}

interface SerializedEvalCase extends Omit<EvalCase, 'createdAt'> {
  readonly createdAt: string
}

interface SerializedEvalRun extends Omit<EvalRun, 'createdAt'> {
  readonly createdAt: string
}

interface SerializedKnowledgeEntry extends Omit<KnowledgeEntry, 'createdAt'> {
  readonly createdAt: string
}

interface StoreData {
  readonly version: 2
  readonly agents: readonly SerializedAgent[]
  readonly conversations: readonly SerializedConversation[]
  readonly messages: readonly SerializedMessage[]
  readonly teachings: readonly SerializedTeaching[]
  readonly evals: readonly SerializedEvalCase[]
  readonly evalRuns: readonly SerializedEvalRun[]
  readonly knowledgeEntries: readonly SerializedKnowledgeEntry[]
}

const emptyStore = (): StoreData => ({
  version: 2,
  agents: [],
  conversations: [],
  messages: [],
  teachings: [],
  evals: [],
  evalRuns: [],
  knowledgeEntries: [],
})

function fromKnowledgeEntry(entry: SerializedKnowledgeEntry): KnowledgeEntry {
  return { ...entry, createdAt: new Date(entry.createdAt) }
}

function asAgent(agent: AgentDefinition): SerializedAgent {
  return {
    ...agent,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }
}

function fromAgent(agent: SerializedAgent): AgentDefinition {
  return {
    ...agent,
    createdAt: new Date(agent.createdAt),
    updatedAt: new Date(agent.updatedAt),
  }
}

function asConversation(conversation: Conversation): SerializedConversation {
  return {
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  }
}

function fromConversation(conversation: SerializedConversation): Conversation {
  return {
    ...conversation,
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
  }
}

function asMessage(message: ConversationMessage): SerializedMessage {
  return { ...message, createdAt: message.createdAt.toISOString() }
}

function fromMessage(message: SerializedMessage): ConversationMessage {
  return { ...message, createdAt: new Date(message.createdAt) }
}

function asTeaching(teaching: TeachingExample): SerializedTeaching {
  return { ...teaching, createdAt: teaching.createdAt.toISOString() }
}

function fromTeaching(teaching: SerializedTeaching): TeachingExample {
  return { ...teaching, createdAt: new Date(teaching.createdAt) }
}

function asEvalCase(evalCase: EvalCase): SerializedEvalCase {
  return { ...evalCase, createdAt: evalCase.createdAt.toISOString() }
}

function fromEvalCase(evalCase: SerializedEvalCase): EvalCase {
  return { ...evalCase, createdAt: new Date(evalCase.createdAt) }
}

function asEvalRun(run: EvalRun): SerializedEvalRun {
  return { ...run, createdAt: run.createdAt.toISOString() }
}

function fromEvalRun(run: SerializedEvalRun): EvalRun {
  return { ...run, createdAt: new Date(run.createdAt) }
}

export class FileStore
  implements
    AgentRepository,
    ConversationRepository,
    TeachingRepository,
    EvalRepository,
    KnowledgeRepository
{
  private writes: Promise<void> = Promise.resolve()

  constructor(private readonly filePath: string) {}

  async createAgent(agent: AgentDefinition): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      agents: [...data.agents, asAgent(agent)],
    }))
  }

  async updateAgent(agent: AgentDefinition): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      agents: data.agents.map((candidate) =>
        candidate.id === agent.id ? asAgent(agent) : candidate,
      ),
    }))
  }

  async deleteAgent(id: string): Promise<void> {
    await this.mutate((data) => {
      const conversationIds = new Set(
        data.conversations
          .filter((conversation) => conversation.agentId === id)
          .map((conversation) => conversation.id),
      )
      const evalIds = new Set(
        data.evals
          .filter((evalCase) => evalCase.agentId === id)
          .map((evalCase) => evalCase.id),
      )
      return {
        ...data,
        agents: data.agents.filter((agent) => agent.id !== id),
        conversations: data.conversations.filter(
          (conversation) => conversation.agentId !== id,
        ),
        messages: data.messages.filter(
          (message) => !conversationIds.has(message.conversationId),
        ),
        teachings: data.teachings.filter((teaching) => teaching.agentId !== id),
        evals: data.evals.filter((evalCase) => evalCase.agentId !== id),
        evalRuns: data.evalRuns.filter(
          (run) => run.agentId !== id && !evalIds.has(run.evalId),
        ),
        knowledgeEntries: data.knowledgeEntries.filter(
          (entry) => entry.agentId !== id,
        ),
      }
    })
  }

  async getAgent(id: string): Promise<AgentDefinition | undefined> {
    const data = await this.read()
    const agent = data.agents.find((candidate) => candidate.id === id)
    return agent ? fromAgent(agent) : undefined
  }

  async listAgents(): Promise<readonly AgentDefinition[]> {
    const data = await this.read()
    return data.agents
      .map(fromAgent)
      .sort(
        (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
      )
  }

  async createConversation(conversation: Conversation): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      conversations: [...data.conversations, asConversation(conversation)],
    }))
  }

  async updateConversation(conversation: Conversation): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      conversations: data.conversations.map((candidate) =>
        candidate.id === conversation.id
          ? asConversation(conversation)
          : candidate,
      ),
    }))
  }

  async deleteConversation(id: string): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      conversations: data.conversations.filter(
        (conversation) => conversation.id !== id,
      ),
      messages: data.messages.filter(
        (message) => message.conversationId !== id,
      ),
    }))
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const data = await this.read()
    const conversation = data.conversations.find(
      (candidate) => candidate.id === id,
    )
    return conversation ? fromConversation(conversation) : undefined
  }

  async listConversations(agentId: string): Promise<readonly Conversation[]> {
    const data = await this.read()
    return data.conversations
      .filter((conversation) => conversation.agentId === agentId)
      .map(fromConversation)
      .sort(
        (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
      )
  }

  async appendMessage(message: ConversationMessage): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      messages: [...data.messages, asMessage(message)],
      conversations: data.conversations.map((conversation) =>
        conversation.id === message.conversationId
          ? { ...conversation, updatedAt: message.createdAt.toISOString() }
          : conversation,
      ),
    }))
  }

  async listMessages(
    conversationId: string,
  ): Promise<readonly ConversationMessage[]> {
    const data = await this.read()
    return data.messages
      .filter((message) => message.conversationId === conversationId)
      .map(fromMessage)
      .sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      )
  }

  async createTeaching(teaching: TeachingExample): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      teachings: [...data.teachings, asTeaching(teaching)],
    }))
  }

  async listTeachings(agentId: string): Promise<readonly TeachingExample[]> {
    const data = await this.read()
    return data.teachings
      .filter((teaching) => teaching.agentId === agentId)
      .map(fromTeaching)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
  }

  async updateTeachingEmbedding(
    teachingId: string,
    embedding: TeachingEmbedding,
  ): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      teachings: data.teachings.map((teaching) =>
        teaching.id === teachingId
          ? { ...teaching, semanticEmbedding: embedding }
          : teaching,
      ),
    }))
  }

  async deleteTeaching(id: string): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      teachings: data.teachings.filter((teaching) => teaching.id !== id),
    }))
  }

  async createEval(evalCase: EvalCase): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      evals: [...data.evals, asEvalCase(evalCase)],
    }))
  }

  async listEvals(agentId: string): Promise<readonly EvalCase[]> {
    const data = await this.read()
    return data.evals
      .filter((evalCase) => evalCase.agentId === agentId)
      .map(fromEvalCase)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
  }

  async createEvalRun(run: EvalRun): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      evalRuns: [...data.evalRuns, asEvalRun(run)],
    }))
  }

  async listEvalRuns(agentId: string): Promise<readonly EvalRun[]> {
    const data = await this.read()
    return data.evalRuns
      .filter((run) => run.agentId === agentId)
      .map(fromEvalRun)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
  }

  async createKnowledgeEntry(entry: KnowledgeEntry): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      knowledgeEntries: [
        ...data.knowledgeEntries,
        { ...entry, createdAt: entry.createdAt.toISOString() },
      ],
    }))
  }

  async listKnowledgeEntries(
    agentId: string,
  ): Promise<readonly KnowledgeEntry[]> {
    const data = await this.read()
    return data.knowledgeEntries
      .filter((entry) => entry.agentId === agentId)
      .map(fromKnowledgeEntry)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
  }

  async deleteKnowledgeEntry(id: string): Promise<void> {
    await this.mutate((data) => ({
      ...data,
      knowledgeEntries: data.knowledgeEntries.filter(
        (entry) => entry.id !== id,
      ),
    }))
  }

  private async mutate(update: (data: StoreData) => StoreData): Promise<void> {
    const write = this.writes.then(async () => {
      const data = await this.read()
      await this.write(update(data))
    })
    this.writes = write.catch(() => undefined)
    await write
  }

  private async read(): Promise<StoreData> {
    try {
      const raw = await readFile(this.filePath, 'utf8')
      const data: unknown = JSON.parse(raw)
      if (!this.isStoreData(data)) throw new Error('Invalid store format')
      if (data.version === 1) {
        return { ...data, version: 2, knowledgeEntries: [] }
      }
      return data
    } catch (error) {
      if (this.isMissingFile(error)) return emptyStore()
      throw new Error(
        `Unable to read Orvel data at ${this.filePath}: ${this.message(error)}`,
      )
    }
  }

  private async write(data: StoreData): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }

  private isStoreData(
    data: unknown,
  ): data is
    | StoreData
    | (Omit<StoreData, 'version' | 'knowledgeEntries'> & { version: 1 }) {
    return (
      typeof data === 'object' &&
      data !== null &&
      ((data as { version?: unknown }).version === 1 ||
        (data as { version?: unknown }).version === 2)
    )
  }

  private isMissingFile(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: unknown }).code === 'ENOENT'
    )
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error'
  }
}

export function createFileStore(filePath: string): FileStore {
  return new FileStore(filePath)
}
