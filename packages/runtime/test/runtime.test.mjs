import assert from 'node:assert/strict'
import test from 'node:test'

import { createRuntime } from '../dist/index.js'

const agent = {
  id: 'guide',
  name: 'Guide',
  instructions: 'Answer clearly.',
  brain: { provider: 'example', model: 'example-model' },
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

  const response = await runtime.run(agent, {
    messages: [{ role: 'user', content: 'Hello?' }],
  })

  assert.equal(response.content, 'Hello.')
  assert.deepEqual(receivedRequest, {
    model: 'example-model',
    messages: [
      { role: 'system', content: 'Answer clearly.' },
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
