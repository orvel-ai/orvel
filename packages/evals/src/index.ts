export interface EvalCase<Input = string, Expected = string> {
  readonly id: string
  readonly agentId: string
  readonly input: Input
  readonly expected: Expected
  readonly createdAt: Date
}

export interface EvalResult {
  readonly passed: boolean
  readonly score?: number
  readonly message?: string
}

export interface EvalRun {
  readonly id: string
  readonly evalId: string
  readonly agentId: string
  readonly input: string
  readonly expected: string
  readonly actual: string
  readonly result: EvalResult
  readonly teachingIds: readonly string[]
  readonly createdAt: Date
}

export interface Evaluator<Actual = unknown, Expected = unknown> {
  readonly name: string
  evaluate(actual: Actual, expected: Expected): Promise<EvalResult>
}

export interface EvalRepository {
  createEval(evalCase: EvalCase): Promise<void>
  listEvals(agentId: string): Promise<readonly EvalCase[]>
  createEvalRun(run: EvalRun): Promise<void>
  listEvalRuns(agentId: string): Promise<readonly EvalRun[]>
}

export function createContainsEvaluator(): Evaluator<string, string> {
  return {
    name: 'case-insensitive-contains',
    async evaluate(actual, expected) {
      const expectedText = expected.trim()
      if (!expectedText) {
        return {
          passed: false,
          message: 'Expected behavior must contain text to check for.',
        }
      }

      const passed = actual
        .toLocaleLowerCase()
        .includes(expectedText.toLocaleLowerCase())
      return {
        passed,
        score: passed ? 1 : 0,
        message: passed
          ? 'Response contains the expected text.'
          : 'Response does not contain the expected text.',
      }
    },
  }
}
