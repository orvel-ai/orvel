import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGroqProvider,
  createGroqSemanticRelevanceProvider,
} from '../dist/index.js'

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

test('Groq semantic relevance provider requests and validates JSON only', async () => {
  let received
  const provider = createGroqSemanticRelevanceProvider({
    apiKey: 'test-key',
    model: 'judge-model',
    baseUrl: 'https://example.test/openai/v1',
    fetch: async (url, init) => {
      received = { url, init }
      return new Response(
        JSON.stringify({
          choices: [
            { message: { content: '{"relevant":true,"confidence":0.94}' } },
          ],
        }),
      )
    },
  })
  const result = await provider.judge({
    query: 'When should my package arrive?',
    teaching: {
      id: 'delivery',
      agentId: 'support',
      userInput: 'How long does delivery take?',
      originalResponse: 'Unknown.',
      correctedResponse: 'Delivery takes 5–7 days.',
      createdAt: new Date(),
    },
  })
  assert.deepEqual(result, { relevant: true, confidence: 0.94 })
  assert.equal(received.url, 'https://example.test/openai/v1/chat/completions')
  assert.equal(
    JSON.parse(received.init.body).response_format.type,
    'json_object',
  )
})

test('Groq semantic relevance provider rejects malformed JSON', async () => {
  const provider = createGroqSemanticRelevanceProvider({
    apiKey: 'test-key',
    fetch: async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'nope' } }] }),
      ),
  })
  await assert.rejects(
    provider.judge({
      query: 'Question',
      teaching: {
        id: 'teaching',
        agentId: 'agent',
        userInput: 'Question',
        originalResponse: 'Old',
        correctedResponse: 'New',
        createdAt: new Date(),
      },
    }),
    /malformed semantic relevance JSON/,
  )
})
