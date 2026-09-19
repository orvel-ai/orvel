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
