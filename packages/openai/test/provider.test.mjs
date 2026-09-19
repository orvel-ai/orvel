import assert from 'node:assert/strict'
import test from 'node:test'

import { createOpenAIProvider } from '../dist/index.js'

test('OpenAI adapter keeps the API key server-side and maps a provider-neutral request', async () => {
  let received
  const provider = createOpenAIProvider({
    apiKey: 'test-key',
    baseUrl: 'https://example.test/v1',
    fetch: async (url, init) => {
      received = { url, init }
      return new Response(
        JSON.stringify({ output_text: 'Hello.', model: 'gpt-test' }),
        { status: 200 },
      )
    },
  })

  const result = await provider.generate({
    model: 'gpt-test',
    instructions: 'Be clear.',
    context: [],
    messages: [
      { role: 'system', content: 'Be clear.' },
      { role: 'user', content: 'Hi' },
    ],
  })

  assert.equal(result.content, 'Hello.')
  assert.equal(received.url, 'https://example.test/v1/responses')
  assert.equal(received.init.headers.Authorization, 'Bearer test-key')
  assert.deepEqual(JSON.parse(received.init.body), {
    model: 'gpt-test',
    input: [
      {
        role: 'developer',
        content: [{ type: 'input_text', text: 'Be clear.' }],
      },
      { role: 'user', content: [{ type: 'input_text', text: 'Hi' }] },
    ],
  })
})

test('OpenAI adapter gives a useful setup message when no key is configured', async () => {
  await assert.rejects(
    createOpenAIProvider({}).generate({
      model: 'gpt-test',
      instructions: '',
      context: [],
      messages: [],
    }),
    /OPENAI_API_KEY/,
  )
})
