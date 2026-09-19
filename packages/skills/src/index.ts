export interface SkillContext {
  readonly agentId: string
  readonly signal?: AbortSignal
}

export interface Skill<Input = unknown, Output = unknown> {
  readonly name: string
  readonly description: string
  execute(input: Input, context: SkillContext): Promise<Output>
}
