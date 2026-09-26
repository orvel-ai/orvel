export interface KnowledgeQuery {
  readonly text: string
  readonly limit?: number
}

export interface KnowledgeChunk {
  readonly id: string
  readonly content: string
  readonly source: string
  readonly score?: number
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface KnowledgeSource {
  readonly id: string
  retrieve(query: KnowledgeQuery): Promise<readonly KnowledgeChunk[]>
}
export interface KnowledgeEntry {
  readonly id: string
  readonly agentId: string
  readonly title: string
  readonly content: string
  readonly sourceUrl?: string
  readonly createdAt: Date
}

export interface KnowledgeRepository {
  createKnowledgeEntry(entry: KnowledgeEntry): Promise<void>
  listKnowledgeEntries(agentId: string): Promise<readonly KnowledgeEntry[]>
  deleteKnowledgeEntry(id: string): Promise<void>
}

export interface KnowledgeTextInput {
  readonly agentId: string
  readonly title: string
  readonly content: string
}

export interface KnowledgeLinkInput {
  readonly agentId: string
  readonly url: string
}

export const KNOWLEDGE_TEXT_MAX_LENGTH = 20_000
export const KNOWLEDGE_LINK_MAX_LENGTH = 2_000
export const KNOWLEDGE_URL_MAX_LENGTH = 2_000
