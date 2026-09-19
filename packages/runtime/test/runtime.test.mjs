import assert from 'node:assert/strict'
import test from 'node:test'

import { createRuntime } from '../dist/index.js'

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
