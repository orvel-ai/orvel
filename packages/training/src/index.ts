export interface TrainingExample {
  readonly id: string
  readonly input: unknown
  readonly expectedOutput: unknown
  readonly explanation?: string
}

export type FeedbackRating = 'positive' | 'negative'

export interface TrainingFeedback {
  readonly id: string
  readonly runId: string
  readonly rating: FeedbackRating
  readonly correction?: unknown
  readonly note?: string
}
