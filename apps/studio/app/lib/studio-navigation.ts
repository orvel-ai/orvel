import type { AgentDefinition } from '@orvel/sdk'

import type { StudioNavigationAgent } from '../studio-shell'
import { orvel } from './orvel'

function shortTitle(text: string | undefined): string {
  const normalized = text?.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'New conversation'
  return normalized.length > 56 ? `${normalized.slice(0, 55)}…` : normalized
}

function relativeTime(value: Date): string {
  const elapsed = Date.now() - value.getTime()
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(value)
}

export async function createStudioNavigation(
  agents: readonly AgentDefinition[],
): Promise<StudioNavigationAgent[]> {
  return Promise.all(
    agents.map(async (agent) => {
      const conversations = await orvel.listConversations(agent.id)
      const recent = await Promise.all(
        conversations.map(async (conversation) => {
          const messages = await orvel.listMessages(conversation.id)
          const firstUserMessage = messages.find(
            (message) => message.role === 'user',
          )
          return {
            id: conversation.id,
            label: conversation.title ?? shortTitle(firstUserMessage?.content),
            updatedAt: relativeTime(conversation.updatedAt),
            timestamp: conversation.updatedAt.getTime(),
          }
        }),
      )
      return {
        id: agent.id,
        name: agent.name,
        provider: agent.brain.provider,
        model: agent.brain.model,
        conversations: recent,
      }
    }),
  )
}
