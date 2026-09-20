import assert from 'node:assert/strict'
import test from 'node:test'

import { createGroqProvider } from '../dist/index.js'

const request = {
  model: 'openai/gpt-oss-20b',
  instructions: 'Be clear.',
  context: [],
  messages: [
    { role: 'system', content: 'Be clear.' },
    { role: 'user', content: 'Hi' },
  ],
}

test('Groq maps provider-neutral messages and parses text plus usage', async () => {
  let received
  const provider = createGroqProvider({
    apiKey: 'test-key',
    baseUrl: 'https://example.test/openai/v1/',
    fetch: async (url, init) => {
      received = { url, init }
      return new Response(
        JSON.stringify({
          model: 'openai/gpt-oss-20b',
          choices: [{ message: { content: 'Hello from Groq.' } }],
          usage: { prompt_tokens: 12, completion_tokens: 4 },
        }),
      )
    },
  })
  const result = await provider.generate(request)

  assert.equal(result.content, 'Hello from Groq.')
  assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 4 })
  assert.equal(received.url, 'https://example.test/openai/v1/chat/completions')
  assert.equal(received.init.headers.Authorization, 'Bearer test-key')
  assert.deepEqual(JSON.parse(received.init.body), {
    model: 'openai/gpt-oss-20b',
    messages: request.messages,
  })
})

test('Groq requires a server-side API key', async () => {
  await assert.rejects(createGroqProvider({}).generate(request), /GROQ_API_KEY/)
})

for (const [status, body, expected] of [
  [401, { error: { message: 'invalid api key' } }, /authentication failed/],
  [429, { error: { message: 'rate limit' } }, /rate limit/],
  [404, { error: { message: 'model not found' } }, /model.*unavailable/],
]) {
  test(`Groq gives a useful error for status ${status}`, async () => {
    await assert.rejects(
      createGroqProvider({
        apiKey: 'test-key',
        fetch: async () => new Response(JSON.stringify(body), { status }),
      }).generate(request),
      expected,
    )
  })
}

test('Groq handles malformed, empty, and network responses', async () => {
  await assert.rejects(
    createGroqProvider({
      apiKey: 'test-key',
      fetch: async () => new Response('not json'),
    }).generate(request),
    /malformed JSON/,
  )
  await assert.rejects(
    createGroqProvider({
      apiKey: 'test-key',
      fetch: async () => new Response(JSON.stringify({ choices: [{}] })),
    }).generate(request),
    /without generated text/,
  )
  await assert.rejects(
    createGroqProvider({
      apiKey: 'test-key',
      fetch: async () => {
        throw new TypeError('fetch failed')
      },
    }).generate(request),
    /Could not reach Groq/,
  )
})
