export interface MemoryRecord {
  readonly id: string
  readonly content: string
  readonly createdAt: Date
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface MemoryQuery {
  readonly text: string
  readonly limit?: number
}

export interface MemoryStore {
  remember(memory: MemoryRecord): Promise<void>
  recall(query: MemoryQuery): Promise<readonly MemoryRecord[]>
  forget(id: string): Promise<void>
}
