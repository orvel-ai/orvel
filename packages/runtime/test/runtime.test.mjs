import assert from 'node:assert/strict'
import test from 'node:test'

import { createAgent, createRuntime, updateAgent } from '../dist/index.js'

const agent = {
  id: 'guide',
  name: 'Guide',
  instructions: 'Answer clearly.',
  brain: { provider: 'example', model: 'example-model' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

test('delegates a run through the configured provider', async () => {
  let receivedRequest
  const runtime = createRuntime({
    providers: [
      {
        id: 'example',
        async generate(request) {
          receivedRequest = request
          return { content: 'Hello.' }
        },
      },
    ],
  })

  const result = await runtime.run(agent, {
    messages: [{ role: 'user', content: 'Hello?' }],
    context: [{ id: 'teaching-1', label: 'Teaching', content: 'Be accurate.' }],
  })

  assert.equal(result.response.content, 'Hello.')
  assert.deepEqual(result.context, [
    { id: 'teaching-1', label: 'Teaching', content: 'Be accurate.' },
  ])
  assert.deepEqual(receivedRequest, {
    model: 'example-model',
    instructions: 'Answer clearly.',
    context: [{ id: 'teaching-1', label: 'Teaching', content: 'Be accurate.' }],
    messages: [
      { role: 'system', content: 'Answer clearly.' },
      { role: 'system', content: '[Teaching]\nBe accurate.' },
      { role: 'user', content: 'Hello?' },
    ],
  })
})

test('rejects an agent whose provider is not registered', async () => {
  const runtime = createRuntime({ providers: [] })

  await assert.rejects(
    runtime.run(agent, { messages: [] }),
    /Model provider "example" is not registered/,
  )
})

test('keeps optional general knowledge distinct and before teaching context', async () => {
  let receivedRequest
  const runtime = createRuntime({
    providers: [
      {
        id: 'example',
        async generate(request) {
          receivedRequest = request
          return { content: 'Hello.' }
        },
      },
    ],
  })
  const withKnowledge = createAgent(
    {
      name: 'Guide',
      instructions: 'Answer clearly.',
      generalKnowledge: 'Delivery takes 5–7 business days.',
      model: { provider: 'example', model: 'example-model' },
    },
    { id: 'knowledge-guide', now: agent.createdAt },
  )
  const updated = updateAgent(
    withKnowledge,
    { generalKnowledge: 'Delivery takes up to one week.' },
    { now: new Date('2026-01-02T00:00:00.000Z') },
  )
  assert.equal(updated.generalKnowledge, 'Delivery takes up to one week.')
  assert.equal(updated.updatedAt.toISOString(), '2026-01-02T00:00:00.000Z')

  await runtime.run(updated, {
    messages: [{ role: 'user', content: 'When will my package arrive?' }],
    context: [{ id: 'teaching-1', label: 'Teaching', content: 'Be accurate.' }],
  })

  assert.deepEqual(
    receivedRequest.context.map((item) => item.label),
    ['Creator-provided general knowledge', 'Teaching'],
  )
  assert.match(
    receivedRequest.messages[1].content,
    /factual reference material supplied by the agent creator/,
  )
  assert.match(receivedRequest.messages[2].content, /^\[Teaching\]/)
})

test('creates agents without general knowledge for backwards compatibility', () => {
  const created = createAgent(
    {
      name: 'Guide',
      instructions: 'Answer clearly.',
      model: { provider: 'example', model: 'example-model' },
    },
    { id: 'legacy-guide', now: agent.createdAt },
  )
  assert.equal(created.generalKnowledge, undefined)
})
