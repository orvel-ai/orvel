import assert from 'node:assert/strict'
import test from 'node:test'

import { createContainsEvaluator } from '../dist/index.js'

test('contains evaluator reports a case-insensitive match', async () => {
  const result = await createContainsEvaluator().evaluate(
    'Refunds normally take 5–7 business days.',
    '5–7 BUSINESS DAYS',
  )

  assert.deepEqual(result, {
    passed: true,
    score: 1,
    message: 'Response contains the expected text.',
  })
})

test('contains evaluator makes a mismatch explicit', async () => {
  const result = await createContainsEvaluator().evaluate(
    'I do not know.',
    '5–7 business days',
  )

  assert.equal(result.passed, false)
  assert.equal(result.score, 0)
})
