import type { RuntimeContext } from '@orvel/runtime'

export interface TeachingExample {
  readonly id: string
  readonly agentId: string
  readonly conversationId?: string
  readonly userInput: string
  readonly originalResponse: string
  readonly correctedResponse: string
  readonly explanation?: string
  readonly semanticEmbedding?: TeachingEmbedding
  readonly createdAt: Date
}

export interface TeachingEmbedding {
  readonly provider: string
  readonly values: readonly number[]
}

export interface CreateTeachingInput {
  readonly agentId: string
  readonly conversationId?: string
  readonly userInput: string
  readonly originalResponse: string
  readonly correctedResponse: string
  readonly explanation?: string
}

export interface TeachingRepository {
  createTeaching(teaching: TeachingExample): Promise<void>
  listTeachings(agentId: string): Promise<readonly TeachingExample[]>
  deleteTeaching(id: string): Promise<void>
}

export interface TeachingEmbeddingRepository {
  updateTeachingEmbedding(
    teachingId: string,
    embedding: TeachingEmbedding,
  ): Promise<void>
}

export interface EmbeddingProvider {
  readonly id: string
  embed(text: string): Promise<readonly number[]>
  embedMany?(texts: readonly string[]): Promise<readonly (readonly number[])[]>
}

export interface TeachingMatch {
  readonly teaching: TeachingExample
  readonly score: number
  readonly lexicalScore?: number
  readonly semanticScore?: number
  readonly strategy?: 'lexical' | 'semantic' | 'hybrid'
}

export interface TeachingRetriever {
  retrieve(agentId: string, query: string): Promise<readonly TeachingMatch[]>
}

export interface KeywordTeachingRetrieverOptions {
  readonly repository: TeachingRepository
  readonly limit?: number
  readonly minimumScore?: number
}

export interface HybridTeachingRetrieverOptions {
  readonly repository: TeachingRepository
  readonly embeddingProvider?: EmbeddingProvider
  readonly limit?: number
  readonly lexicalMinimumScore?: number
  readonly semanticMinimumScore?: number
  readonly lexicalWeight?: number
  readonly semanticWeight?: number
}

const ignoredTokens = new Set([
  'about',
  'after',
  'agent',
  'again',
  'also',
  'and',
  'are',
  'been',
  'can',
  'could',
  'does',
  'for',
  'from',
  'have',
  'how',
  'into',
  'its',
  'long',
  'need',
  'not',
  'please',
  'should',
  'tell',
  'that',
  'the',
  'their',
  'them',
  'then',
  'this',
  'was',
  'what',
  'when',
  'where',
  'which',
  'will',
  'with',
  'would',
  'you',
  'your',
])

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.map((token) => token.replace(/s$/, ''))
      .filter((token) => token.length > 2 && !ignoredTokens.has(token)) ?? [],
  )
}

function lexicalScore(
  queryTokens: ReadonlySet<string>,
  teaching: TeachingExample,
): number {
  if (queryTokens.size === 0) return 0
  const teachingTokens = tokens(teachingText(teaching))
  const overlap = [...queryTokens].filter((token) =>
    teachingTokens.has(token),
  ).length
  return overlap / queryTokens.size
}

function teachingText(teaching: TeachingExample): string {
  return [
    teaching.userInput,
    teaching.correctedResponse,
    teaching.explanation ?? '',
  ].join('\n')
}

function isUsableEmbedding(values: readonly number[]): boolean {
  return values.length > 0 && values.every(Number.isFinite)
}

function cosineSimilarity(
  left: readonly number[],
  right: readonly number[],
): number | undefined {
  if (
    left.length !== right.length ||
    !isUsableEmbedding(left) ||
    !isUsableEmbedding(right)
  ) {
    return undefined
  }
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index]!
    const rightValue = right[index]!
    dot += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return undefined
  return dot / Math.sqrt(leftMagnitude * rightMagnitude)
}

function canCacheEmbeddings(
  repository: TeachingRepository,
): repository is TeachingRepository & TeachingEmbeddingRepository {
  return (
    typeof (repository as Partial<TeachingEmbeddingRepository>)
      .updateTeachingEmbedding === 'function'
  )
}

function normalizedCorrection(teaching: TeachingExample): string {
  return teaching.correctedResponse.trim().toLowerCase()
}

export function createTeaching(
  input: CreateTeachingInput,
  options: { readonly id: string; readonly now?: Date },
): TeachingExample {
  const userInput = input.userInput.trim()
  const originalResponse = input.originalResponse.trim()
  const correctedResponse = input.correctedResponse.trim()
  const agentId = input.agentId.trim()

  if (!agentId) throw new Error('A teaching must belong to an agent.')
  if (!userInput || !originalResponse || !correctedResponse) {
    throw new Error(
      'Teaching requires the user input, original response, and correction.',
    )
  }

  const explanation = input.explanation?.trim()
  const conversationId = input.conversationId?.trim()

  return {
    id: options.id,
    agentId,
    ...(conversationId ? { conversationId } : {}),
    userInput,
    originalResponse,
    correctedResponse,
    ...(explanation ? { explanation } : {}),
    createdAt: options.now ?? new Date(),
  }
}

export function createKeywordTeachingRetriever({
  repository,
  limit = 3,
  minimumScore = 0.12,
}: KeywordTeachingRetrieverOptions): TeachingRetriever {
  return {
    async retrieve(agentId, query) {
      const queryTokens = tokens(query)
      if (queryTokens.size === 0) return []

      const teachings = await repository.listTeachings(agentId)

      return teachings
        .map((teaching) => {
          const score = lexicalScore(queryTokens, teaching)
          return {
            teaching,
            score,
            lexicalScore: score,
            strategy: 'lexical' as const,
          }
        })
        .filter((match) => match.score >= minimumScore)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
    },
  }
}

export function createHybridTeachingRetriever({
  repository,
  embeddingProvider,
  limit = 3,
  lexicalMinimumScore = 0.12,
  semanticMinimumScore = 0.72,
  lexicalWeight = 0.35,
  semanticWeight = 0.65,
}: HybridTeachingRetrieverOptions): TeachingRetriever {
  const embeddingCache = new Map<string, readonly number[]>()

  return {
    async retrieve(agentId, query) {
      const queryTokens = tokens(query)
      const teachings = await repository.listTeachings(agentId)
      if (teachings.length === 0) return []
      const lexicalMatches = teachings.map((teaching) => ({
        teaching,
        lexicalScore: lexicalScore(queryTokens, teaching),
      }))

      if (!embeddingProvider || !query.trim()) {
        return lexicalMatches
          .filter((match) => match.lexicalScore >= lexicalMinimumScore)
          .sort(
            (left, right) =>
              right.lexicalScore - left.lexicalScore ||
              left.teaching.id.localeCompare(right.teaching.id),
          )
          .slice(0, limit)
          .map((match) => ({
            teaching: match.teaching,
            score: match.lexicalScore,
            lexicalScore: match.lexicalScore,
            strategy: 'lexical' as const,
          }))
      }

      let queryEmbedding: readonly number[]
      try {
        queryEmbedding = await embeddingProvider.embed(query)
        if (!isUsableEmbedding(queryEmbedding))
          throw new Error('Invalid embedding')
      } catch {
        return lexicalMatches
          .filter((match) => match.lexicalScore >= lexicalMinimumScore)
          .sort(
            (left, right) =>
              right.lexicalScore - left.lexicalScore ||
              left.teaching.id.localeCompare(right.teaching.id),
          )
          .slice(0, limit)
          .map((match) => ({
            teaching: match.teaching,
            score: match.lexicalScore,
            lexicalScore: match.lexicalScore,
            strategy: 'lexical' as const,
          }))
      }

      const missing = teachings.filter(
        (teaching) =>
          teaching.semanticEmbedding?.provider !== embeddingProvider.id &&
          !embeddingCache.has(teaching.id),
      )
      let generated: readonly (readonly number[])[]
      if (missing.length === 0) {
        generated = []
      } else {
        try {
          generated = embeddingProvider.embedMany
            ? await embeddingProvider.embedMany(missing.map(teachingText))
            : await Promise.all(
                missing.map((teaching) =>
                  embeddingProvider.embed(teachingText(teaching)),
                ),
              )
          if (
            generated.length !== missing.length ||
            generated.some((values) => !isUsableEmbedding(values))
          ) {
            throw new Error('Invalid embedding')
          }
        } catch {
          generated = []
        }
      }

      const generatedById = new Map<string, readonly number[]>()
      const cacheWrites: Promise<void>[] = []
      missing.forEach((teaching, index) => {
        const values = generated[index]
        if (values) {
          generatedById.set(teaching.id, values)
          embeddingCache.set(teaching.id, values)
          if (canCacheEmbeddings(repository)) {
            cacheWrites.push(
              repository.updateTeachingEmbedding(teaching.id, {
                provider: embeddingProvider.id,
                values,
              }),
            )
          }
        }
      })
      await Promise.all(cacheWrites)

      const matches: TeachingMatch[] = []
      for (const match of lexicalMatches) {
        const values =
          match.teaching.semanticEmbedding?.provider === embeddingProvider.id
            ? match.teaching.semanticEmbedding.values
            : (embeddingCache.get(match.teaching.id) ??
              generatedById.get(match.teaching.id))
        const semanticScore = values
          ? cosineSimilarity(queryEmbedding, values)
          : undefined
        const eligible =
          match.lexicalScore >= lexicalMinimumScore ||
          (semanticScore !== undefined && semanticScore >= semanticMinimumScore)
        if (!eligible) continue
        const score =
          semanticScore === undefined
            ? match.lexicalScore
            : lexicalWeight * match.lexicalScore +
              semanticWeight * semanticScore
        matches.push({
          teaching: match.teaching,
          score,
          lexicalScore: match.lexicalScore,
          ...(semanticScore !== undefined ? { semanticScore } : {}),
          strategy:
            semanticScore === undefined
              ? 'lexical'
              : match.lexicalScore > 0
                ? 'hybrid'
                : 'semantic',
        })
      }
      matches.sort(
        (left, right) =>
          right.score - left.score ||
          (right.semanticScore ?? -1) - (left.semanticScore ?? -1) ||
          (right.lexicalScore ?? -1) - (left.lexicalScore ?? -1) ||
          left.teaching.id.localeCompare(right.teaching.id),
      )

      const seenCorrections = new Set<string>()
      return matches
        .filter((match) => {
          const correction = normalizedCorrection(match.teaching)
          if (seenCorrections.has(correction)) return false
          seenCorrections.add(correction)
          return true
        })
        .slice(0, limit)
    },
  }
}

export function createTeachingContext(
  matches: readonly TeachingMatch[],
): readonly RuntimeContext[] {
  if (matches.length === 0) return []

  const examples = matches
    .map(({ teaching }, index) => {
      const explanation = teaching.explanation
        ? `\nWhy this correction matters: ${teaching.explanation}`
        : ''
      return [
        `Example ${index + 1} (teaching id: ${teaching.id})`,
        `User asked: ${teaching.userInput}`,
        `Earlier response: ${teaching.originalResponse}`,
        `Creator-corrected response: ${teaching.correctedResponse}${explanation}`,
      ].join('\n')
    })
    .join('\n\n')

  return [
    {
      id: `teachings:${matches.map((match) => match.teaching.id).join(',')}`,
      label: 'Creator-supplied teaching examples',
      content: [
        "Use the following corrections as guidance when they are relevant to the user's request.",
        'Do not claim that these examples are user messages or hidden policy.',
        examples,
      ].join('\n\n'),
    },
  ]
}

export type TrainingExample = TeachingExample
