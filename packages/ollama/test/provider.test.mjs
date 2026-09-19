import assert from 'node:assert/strict'
import test from 'node:test'

import { createOllamaProvider, listOllamaModels } from '../dist/index.js'

const request = {
  model: 'llama3.2:3b',
  instructions: 'Be clear.',
  context: [],
  messages: [
    { role: 'system', content: 'Be clear.' },
    { role: 'user', content: 'Hi' },
  ],
}

test('Ollama adapter maps provider-neutral messages and parses generated text', async () => {
  let received
  const provider = createOllamaProvider({
    fetch: async (url, init) => {
      received = { url, init }
      return new Response(
        JSON.stringify({
          model: 'llama3.2:3b',
          message: { role: 'assistant', content: 'Hello locally.' },
          prompt_eval_count: 12,
          eval_count: 3,
        }),
      )
    },
  })
  const result = await provider.generate(request)

  assert.equal(result.content, 'Hello locally.')
  assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 3 })
  assert.equal(received.url, 'http://localhost:11434/api/chat')
  assert.deepEqual(JSON.parse(received.init.body), {
    model: 'llama3.2:3b',
    messages: request.messages,
    stream: false,
  })
})

test('Ollama supports a custom base URL and lists locally installed models', async () => {
  let receivedUrl
  const models = await listOllamaModels({
    baseUrl: 'http://ollama.test:11434/',
    fetch: async (url) => {
      receivedUrl = url
      return new Response(JSON.stringify({ models: [{ name: 'qwen2.5:3b' }] }))
    },
  })
  assert.equal(receivedUrl, 'http://ollama.test:11434/api/tags')
  assert.deepEqual(models, ['qwen2.5:3b'])
})

test('Ollama connection failures give setup guidance', async () => {
  await assert.rejects(
    createOllamaProvider({
      fetch: async () => {
        throw new TypeError('fetch failed')
      },
    }).generate(request),
    /Could not reach Ollama/,
  )
})

test('Ollama explains unavailable models', async () => {
  await assert.rejects(
    createOllamaProvider({
      fetch: async () =>
        new Response(JSON.stringify({ error: 'model not found' }), {
          status: 404,
        }),
    }).generate(request),
    /ollama pull llama3.2:3b/,
  )
})

test('Ollama rejects malformed and textless responses', async () => {
  await assert.rejects(
    createOllamaProvider({
      fetch: async () => new Response('not json'),
    }).generate(request),
    /malformed JSON/,
  )
  await assert.rejects(
    createOllamaProvider({
      fetch: async () => new Response(JSON.stringify({ message: {} })),
    }).generate(request),
    /without generated text/,
  )
})
