export interface EvalCase<Input = unknown, Expected = unknown> {
  readonly id: string
  readonly input: Input
  readonly expected: Expected
}

export interface EvalResult {
  readonly passed: boolean
  readonly score?: number
  readonly message?: string
}

export interface Evaluator<Actual = unknown, Expected = unknown> {
  readonly name: string
  evaluate(actual: Actual, expected: Expected): Promise<EvalResult>
}
