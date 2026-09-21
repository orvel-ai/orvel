import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { FileStore, createFileStore } from '../dist/index.js'

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
      generalKnowledge: 'Delivery takes 5–7 business days.',
      brain: { provider: 'mock', model: 'mock-1' },
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await store.createConversation({
      id: 'conversation-1',
      agentId: 'agent-1',
      title: 'Refund question',
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
      (await reopenedStore.listAgents())[0].generalKnowledge,
      'Delivery takes 5–7 business days.',
    )
    await reopenedStore.updateAgent({
      ...(await reopenedStore.getAgent('agent-1')),
      generalKnowledge: 'Returns are accepted within 14 days.',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    assert.equal(
      (await new FileStore(dataPath).getAgent('agent-1')).generalKnowledge,
      'Returns are accepted within 14 days.',
    )
    assert.equal(
      (await reopenedStore.listMessages('conversation-1'))[0].content,
      'Refund?',
    )
    assert.equal(
      (await reopenedStore.getConversation('conversation-1')).title,
      'Refund question',
    )
    await reopenedStore.updateConversation({
      ...(await reopenedStore.getConversation('conversation-1')),
      title: 'Refund follow-up',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    assert.equal(
      (await new FileStore(dataPath).getConversation('conversation-1')).title,
      'Refund follow-up',
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

test('reads existing agent records without general knowledge', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'orvel-local-'))
  const dataPath = join(directory, 'data.json')
  try {
    await writeFile(
      dataPath,
      JSON.stringify({
        version: 1,
        agents: [
          {
            id: 'legacy-agent',
            name: 'Legacy',
            instructions: 'Help.',
            brain: { provider: 'mock', model: 'mock-1' },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        conversations: [],
        messages: [],
        teachings: [],
        evals: [],
        evalRuns: [],
      }),
    )
    assert.equal(
      (await createFileStore(dataPath).getAgent('legacy-agent'))
        .generalKnowledge,
      undefined,
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
