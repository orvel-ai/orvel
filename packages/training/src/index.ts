import type { RuntimeContext } from '@orvel/runtime'

export interface TeachingExample {
  readonly id: string
  readonly agentId: string
  readonly conversationId?: string
  readonly userInput: string
  readonly originalResponse: string
  readonly correctedResponse: string
  readonly explanation?: string
  readonly createdAt: Date
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

export interface TeachingMatch {
  readonly teaching: TeachingExample
  readonly score: number
}

export interface TeachingRetriever {
  retrieve(agentId: string, query: string): Promise<readonly TeachingMatch[]>
}

export interface KeywordTeachingRetrieverOptions {
  readonly repository: TeachingRepository
  readonly limit?: number
  readonly minimumScore?: number
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
          const teachingTokens = tokens(
            [
              teaching.userInput,
              teaching.correctedResponse,
              teaching.explanation ?? '',
            ].join(' '),
          )
          const overlap = [...queryTokens].filter((token) =>
            teachingTokens.has(token),
          ).length
          return { teaching, score: overlap / queryTokens.size }
        })
        .filter((match) => match.score >= minimumScore)
        .sort((left, right) => right.score - left.score)
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
