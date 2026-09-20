import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createFileStore } from '../dist/index.js'

test('persists agents, conversations, messages, and teachings across store instances', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'orvel-local-'))
  const dataPath = join(directory, 'data.json')
  const timestamp = new Date('2026-01-01T00:00:00.000Z')

  try {
    const store = createFileStore(dataPath)
    await store.createAgent({
      id: 'agent-1',
      name: 'SupportBot',
      instructions: 'Help customers.',
      brain: { provider: 'mock', model: 'mock-1' },
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await store.createConversation({
      id: 'conversation-1',
      agentId: 'agent-1',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await store.appendMessage({
      id: 'message-1',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'Refund?',
      createdAt: timestamp,
    })
    await store.createTeaching({
      id: 'teaching-1',
      agentId: 'agent-1',
      conversationId: 'conversation-1',
      userInput: 'Refund?',
      originalResponse: 'Instant.',
      correctedResponse: '5–7 business days.',
      createdAt: timestamp,
    })
    await store.updateTeachingEmbedding('teaching-1', {
      provider: 'test-embedding-v1',
      values: [0.25, 0.75],
    })

    const reopenedStore = createFileStore(dataPath)
    assert.equal((await reopenedStore.listAgents())[0].name, 'SupportBot')
    assert.equal(
      (await reopenedStore.listMessages('conversation-1'))[0].content,
      'Refund?',
    )
    assert.equal(
      (await reopenedStore.listTeachings('agent-1'))[0].correctedResponse,
      '5–7 business days.',
    )
    assert.deepEqual(
      (await reopenedStore.listTeachings('agent-1'))[0].semanticEmbedding,
      { provider: 'test-embedding-v1', values: [0.25, 0.75] },
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
