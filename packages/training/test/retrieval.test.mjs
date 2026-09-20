import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createHybridTeachingRetriever,
  createKeywordTeachingRetriever,
  createTeachingContext,
} from '../dist/index.js'

const refundTeaching = {
  id: 'refund-teaching',
  agentId: 'support-bot',
  userInput: 'How long do refunds take?',
  originalResponse: 'Refunds are instant.',
  correctedResponse: 'Refunds normally take 5–7 business days.',
  explanation: 'Never tell customers refunds are instant.',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

const repository = { listTeachings: async () => [refundTeaching] }

const deliveryTeaching = {
  id: 'delivery-teaching',
  agentId: 'support-bot',
  userInput: 'How long does delivery take?',
  originalResponse: 'I am not sure.',
  correctedResponse: 'Delivery typically takes 5 to 7 days maximum.',
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
}

function createSemanticProvider() {
  const vectorFor = (text) =>
    /delivery|order|package|eta|parcel|arrive/i.test(text) ? [1, 0] : [0, 1]
  return {
    id: 'fake-local-semantic-v1',
    async embed(text) {
      return vectorFor(text)
    },
    async embedMany(texts) {
      return texts.map(vectorFor)
    },
  }
}

test('retrieves a related teaching using deterministic token overlap', async () => {
  const retriever = createKeywordTeachingRetriever({ repository })
  const matches = await retriever.retrieve(
    'support-bot',
    'When should I expect my refund?',
  )

  assert.equal(matches.length, 1)
  assert.equal(matches[0].teaching.id, 'refund-teaching')
  assert.ok(matches[0].score > 0)
})

test('does not retrieve unrelated teaching', async () => {
  const retriever = createKeywordTeachingRetriever({ repository })
  const matches = await retriever.retrieve(
    'support-bot',
    'What color is the sky?',
  )

  assert.deepEqual(matches, [])
})

test('formats retrieved teaching as explicit creator context', () => {
  const context = createTeachingContext([
    { teaching: refundTeaching, score: 0.5 },
  ])

  assert.equal(context.length, 1)
  assert.match(
    context[0].content,
    /Creator-corrected response: Refunds normally take 5–7 business days/,
  )
  assert.match(context[0].content, /teaching id: refund-teaching/)
})

test('hybrid retrieval matches delivery paraphrases through semantic similarity', async () => {
  const retriever = createHybridTeachingRetriever({
    repository: { listTeachings: async () => [deliveryTeaching] },
    embeddingProvider: createSemanticProvider(),
  })

  for (const question of [
    'When will I get my order?',
    'When should my package arrive?',
    "What's the ETA on my delivery?",
    'How long before my parcel gets here?',
  ]) {
    const matches = await retriever.retrieve('support-bot', question)
    assert.equal(matches.length, 1, question)
    assert.equal(matches[0].teaching.id, 'delivery-teaching')
    assert.ok(matches[0].semanticScore >= 0.72)
  }
})

test('hybrid retrieval rejects unrelated prompts and keeps agents isolated', async () => {
  const retriever = createHybridTeachingRetriever({
    repository: {
      listTeachings: async (agentId) =>
        agentId === 'support-bot' ? [deliveryTeaching] : [],
    },
    embeddingProvider: createSemanticProvider(),
  })

  for (const question of [
    'What color is the sky?',
    'Write a JavaScript function that adds two numbers.',
    'What is the capital of Japan?',
  ]) {
    assert.deepEqual(await retriever.retrieve('support-bot', question), [])
  }
  assert.deepEqual(
    await retriever.retrieve('another-agent', 'When will I get my order?'),
    [],
  )
})

test('hybrid retrieval caches embeddings and falls back to lexical results', async () => {
  let teaching = { ...deliveryTeaching }
  let embedManyCalls = 0
  const repositoryWithCache = {
    async listTeachings() {
      return [teaching]
    },
    async updateTeachingEmbedding(id, embedding) {
      assert.equal(id, 'delivery-teaching')
      teaching = { ...teaching, semanticEmbedding: embedding }
    },
  }
  const embeddingProvider = {
    ...createSemanticProvider(),
    async embedMany(texts) {
      embedManyCalls += 1
      return texts.map(() => [1, 0])
    },
  }
  const retriever = createHybridTeachingRetriever({
    repository: repositoryWithCache,
    embeddingProvider,
  })
  await retriever.retrieve('support-bot', 'When will I get my order?')
  await retriever.retrieve('support-bot', 'When should my package arrive?')
  assert.equal(embedManyCalls, 1)

  const fallback = createHybridTeachingRetriever({
    repository: { listTeachings: async () => [refundTeaching] },
    embeddingProvider: {
      id: 'unavailable',
      async embed() {
        throw new Error('offline')
      },
    },
  })
  const matches = await fallback.retrieve(
    'support-bot',
    'When should I expect my refund?',
  )
  assert.equal(matches[0].strategy, 'lexical')
})
