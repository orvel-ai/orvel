import assert from 'node:assert/strict'
import test from 'node:test'

import {
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
