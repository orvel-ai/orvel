'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { orvel } from './lib/orvel'

function value(formData: FormData, name: string): string {
  const field = formData.get(name)
  return typeof field === 'string' ? field : ''
}

function withMessage(path: string, error: unknown): never {
  const message =
    error instanceof Error ? error.message : 'Something went wrong.'
  redirect(
    `${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`,
  )
}

export async function createAgentAction(formData: FormData): Promise<void> {
  let agent
  try {
    agent = await orvel.createAgent({
      name: value(formData, 'name'),
      description: value(formData, 'description'),
      instructions: value(formData, 'instructions'),
      generalKnowledge: value(formData, 'generalKnowledge'),
      model: {
        provider: value(formData, 'provider'),
        model: value(formData, 'model'),
      },
    })
  } catch (error) {
    withMessage('/agents/new', error)
  }
  revalidatePath('/')
  redirect(`/agents/${agent.id}`)
}

export async function updateGeneralKnowledgeAction(
  formData: FormData,
): Promise<void> {
  const agentId = value(formData, 'agentId')
  try {
    await orvel.updateAgent(agentId, {
      generalKnowledge: value(formData, 'generalKnowledge'),
    })
  } catch (error) {
    withMessage(`/agents/${agentId}?tab=knowledge`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(
    `/agents/${agentId}?tab=knowledge&notice=General%20Knowledge%20saved`,
  )
}

export async function updateAgentAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  try {
    await orvel.updateAgent(agentId, {
      name: value(formData, 'name'),
      description: value(formData, 'description'),
      instructions: value(formData, 'instructions'),
      model: {
        provider: value(formData, 'provider'),
        model: value(formData, 'model'),
      },
    })
  } catch (error) {
    withMessage(`/agents/${agentId}?tab=settings`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  revalidatePath('/')
  redirect(`/agents/${agentId}?tab=settings&notice=Agent%20settings%20saved`)
}

export async function startConversationAction(
  formData: FormData,
): Promise<void> {
  const agentId = value(formData, 'agentId')
  let conversation
  try {
    conversation = await orvel.createConversation(agentId)
  } catch (error) {
    withMessage(`/agents/${agentId}`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(`/agents/${agentId}?conversation=${conversation.id}`)
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  const conversationId = value(formData, 'conversationId')
  const destination = `/agents/${agentId}?conversation=${conversationId}`
  try {
    await orvel.sendMessage({
      conversationId,
      content: value(formData, 'content'),
    })
  } catch (error) {
    withMessage(destination, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(destination)
}

export async function saveTeachingAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  const conversationId = value(formData, 'conversationId')
  try {
    await orvel.saveTeaching({
      agentId,
      conversationId,
      userInput: value(formData, 'userInput'),
      originalResponse: value(formData, 'originalResponse'),
      correctedResponse: value(formData, 'correctedResponse'),
      explanation: value(formData, 'explanation'),
    })
  } catch (error) {
    withMessage(`/agents/${agentId}?conversation=${conversationId}`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(
    `/agents/${agentId}?conversation=${conversationId}&notice=Teaching%20saved`,
  )
}

export async function deleteTeachingAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  try {
    await orvel.deleteTeaching(value(formData, 'teachingId'))
  } catch (error) {
    withMessage(`/agents/${agentId}?tab=teachings`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(`/agents/${agentId}?tab=teachings&notice=Teaching%20deleted`)
}

export async function createEvalAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  try {
    await orvel.createEval({
      agentId,
      input: value(formData, 'input'),
      expected: value(formData, 'expected'),
    })
  } catch (error) {
    withMessage(`/agents/${agentId}?tab=evals`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(`/agents/${agentId}?tab=evals&notice=Eval%20saved`)
}

export async function runEvalAction(formData: FormData): Promise<void> {
  const agentId = value(formData, 'agentId')
  try {
    await orvel.runEval(value(formData, 'evalId'))
  } catch (error) {
    withMessage(`/agents/${agentId}?tab=evals`, error)
  }
  revalidatePath(`/agents/${agentId}`)
  redirect(`/agents/${agentId}?tab=evals&notice=Eval%20run%20complete`)
}
