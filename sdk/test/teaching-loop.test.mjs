import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createHybridTeachingRetriever,
  createOrvelClient,
  createRuntime,
} from '../dist/index.js'

function createStore() {
  const agents = []
  const conversations = []
  const messages = []
  const teachings = []
  const evals = []
  const runs = []
  return {
    async createAgent(agent) {
      agents.push(agent)
    },
    async getAgent(id) {
      return agents.find((agent) => agent.id === id)
    },
    async listAgents() {
      return agents
    },
    async createConversation(conversation) {
      conversations.push(conversation)
    },
    async getConversation(id) {
      return conversations.find((conversation) => conversation.id === id)
    },
    async listConversations(agentId) {
      return conversations.filter(
        (conversation) => conversation.agentId === agentId,
      )
    },
    async appendMessage(message) {
      messages.push(message)
    },
    async listMessages(conversationId) {
      return messages.filter(
        (message) => message.conversationId === conversationId,
      )
    },
    async createTeaching(teaching) {
      teachings.push(teaching)
    },
    async listTeachings(agentId) {
      return teachings.filter((teaching) => teaching.agentId === agentId)
    },
    async deleteTeaching(id) {
      const index = teachings.findIndex((teaching) => teaching.id === id)
      if (index >= 0) teachings.splice(index, 1)
    },
    async createEval(evalCase) {
      evals.push(evalCase)
    },
    async listEvals(agentId) {
      return evals.filter((evalCase) => evalCase.agentId === agentId)
    },
    async createEvalRun(run) {
      runs.push(run)
    },
    async listEvalRuns(agentId) {
      return runs.filter((run) => run.agentId === agentId)
    },
  }
}

test('teaching is retrieved, passed as inspectable context, and used by the SDK run', async () => {
  const requests = []
  const runtime = createRuntime({
    providers: [
      {
        id: 'mock',
        async generate(request) {
          requests.push(request)
          return {
            content: request.context.length
              ? 'Refunds normally take 5–7 business days.'
              : 'I am not sure.',
          }
        },
      },
    ],
  })
  let nextId = 0
  const client = createOrvelClient({
    store: createStore(),
    runtime,
    createId: () => `id-${++nextId}`,
  })
  const agent = await client.createAgent({
    name: 'SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'mock', model: 'mock-1' },
  })
  const firstConversation = await client.createConversation(agent.id)
  const first = await client.sendMessage({
    conversationId: firstConversation.id,
    content: 'How long do refunds take?',
  })
  await client.saveTeaching({
    agentId: agent.id,
    conversationId: firstConversation.id,
    userInput: 'How long do refunds take?',
    originalResponse: first.message.content,
    correctedResponse: 'Refunds normally take 5–7 business days.',
  })

  const secondConversation = await client.createConversation(agent.id)
  const second = await client.sendMessage({
    conversationId: secondConversation.id,
    content: 'When should I expect my refund?',
  })

  assert.equal(
    second.message.content,
    'Refunds normally take 5–7 business days.',
  )
  assert.deepEqual(second.teachingIds, ['id-5'])
  assert.match(
    requests[1].context[0].content,
    /Creator-corrected response: Refunds normally take 5–7 business days/,
  )
})

test('agent validation and deterministic eval behavior are exposed through the SDK', async () => {
  const runtime = createRuntime({
    providers: [
      {
        id: 'mock',
        async generate() {
          return { content: 'Refunds take 5–7 business days.' }
        },
      },
    ],
  })
  const client = createOrvelClient({
    store: createStore(),
    runtime,
    createId: (() => {
      let id = 0
      return () => `id-${++id}`
    })(),
  })
  await assert.rejects(
    client.createAgent({
      name: '',
      instructions: 'Help.',
      model: { provider: 'mock', model: 'mock-1' },
    }),
    /agent name/,
  )
  const agent = await client.createAgent({
    name: 'SupportBot',
    instructions: 'Help.',
    model: { provider: 'mock', model: 'mock-1' },
  })
  const evalCase = await client.createEval({
    agentId: agent.id,
    input: 'When is my refund?',
    expected: '5–7 business days',
  })
  const { run } = await client.runEval(evalCase.id)
  assert.equal(run.result.passed, true)
})

test('Ollama-backed agents receive only relevant teaching context', async () => {
  const requests = []
  const runtime = createRuntime({
    providers: [
      {
        id: 'ollama',
        async generate(request) {
          requests.push(request)
          return { content: 'Local response.' }
        },
      },
    ],
  })
  let nextId = 0
  const client = createOrvelClient({
    store: createStore(),
    runtime,
    createId: () => `ollama-${++nextId}`,
  })
  const agent = await client.createAgent({
    name: 'Local SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'ollama', model: 'llama3.2:3b' },
  })
  await client.saveTeaching({
    agentId: agent.id,
    userInput: 'How long do refunds take?',
    originalResponse: 'I do not know.',
    correctedResponse: 'Refunds normally take 5–7 business days.',
  })

  const refundConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: refundConversation.id,
    content: 'When should I expect my refund?',
  })
  const skyConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: skyConversation.id,
    content: 'What color is the sky?',
  })

  assert.equal(requests[0].context.length, 1)
  assert.match(requests[0].context[0].content, /Refunds normally take/)
  assert.deepEqual(requests[1].context, [])
})

test('Groq-backed agents receive only relevant teaching context', async () => {
  const requests = []
  const runtime = createRuntime({
    providers: [
      {
        id: 'groq',
        async generate(request) {
          requests.push(request)
          return { content: 'Cloud response.' }
        },
      },
    ],
  })
  let nextId = 0
  const client = createOrvelClient({
    store: createStore(),
    runtime,
    createId: () => `groq-${++nextId}`,
  })
  const agent = await client.createAgent({
    name: 'Groq SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'groq', model: 'openai/gpt-oss-20b' },
  })
  await client.saveTeaching({
    agentId: agent.id,
    userInput: 'How long do refunds take?',
    originalResponse: 'I do not know.',
    correctedResponse: 'Refunds normally take 5–7 business days.',
  })

  const refundConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: refundConversation.id,
    content: 'When should I expect my refund?',
  })
  const skyConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: skyConversation.id,
    content: 'What color is the sky?',
  })

  assert.equal(requests[0].context.length, 1)
  assert.match(requests[0].context[0].content, /Refunds normally take/)
  assert.deepEqual(requests[1].context, [])
})

test('semantic retrieval reaches a delivery teaching in a fresh conversation only', async () => {
  const requests = []
  const runtime = createRuntime({
    providers: [
      {
        id: 'mock',
        async generate(request) {
          requests.push(request)
          return { content: 'Mock response.' }
        },
      },
    ],
  })
  const store = createStore()
  const embeddingProvider = {
    id: 'test-semantic-v1',
    async embed(text) {
      return /delivery|order|package|eta|parcel|arrive/i.test(text)
        ? [1, 0]
        : [0, 1]
    },
    async embedMany(texts) {
      return Promise.all(texts.map((text) => this.embed(text)))
    },
  }
  let nextId = 0
  const client = createOrvelClient({
    store,
    runtime,
    teachingRetriever: createHybridTeachingRetriever({
      repository: store,
      embeddingProvider,
    }),
    createId: () => `semantic-${++nextId}`,
  })
  const agent = await client.createAgent({
    name: 'SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'mock', model: 'mock-1' },
  })
  const firstConversation = await client.createConversation(agent.id)
  const first = await client.sendMessage({
    conversationId: firstConversation.id,
    content: 'How long does delivery take?',
  })
  await client.saveTeaching({
    agentId: agent.id,
    conversationId: firstConversation.id,
    userInput: 'How long does delivery take?',
    originalResponse: first.message.content,
    correctedResponse: 'Delivery typically takes 5 to 7 days maximum.',
  })

  const semanticConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: semanticConversation.id,
    content: 'When will I get my order?',
  })
  assert.equal(requests[1].context.length, 1)
  assert.match(
    requests[1].context[0].content,
    /Delivery typically takes 5 to 7 days maximum/,
  )

  const unrelatedConversation = await client.createConversation(agent.id)
  await client.sendMessage({
    conversationId: unrelatedConversation.id,
    content: 'What color is the sky?',
  })
  assert.deepEqual(requests[2].context, [])
})

test('a failed LLM relevance judge falls back without breaking chat', async () => {
  const runtime = createRuntime({
    providers: [
      {
        id: 'groq',
        async generate(request) {
          return {
            content: request.context.length
              ? 'Refund teaching used.'
              : 'No teaching.',
          }
        },
      },
    ],
  })
  const store = createStore()
  const client = createOrvelClient({
    store,
    runtime,
    teachingRetriever: createHybridTeachingRetriever({
      repository: store,
      semanticRelevanceProvider: {
        id: 'malformed-judge',
        async judge() {
          throw new Error('malformed JSON')
        },
      },
    }),
    createId: (() => {
      let id = 0
      return () => `fallback-${++id}`
    })(),
  })
  const agent = await client.createAgent({
    name: 'SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'groq', model: 'openai/gpt-oss-20b' },
  })
  await client.saveTeaching({
    agentId: agent.id,
    userInput: 'How long do refunds take?',
    originalResponse: 'Unknown.',
    correctedResponse: 'Refunds normally take 5–7 business days.',
  })
  const conversation = await client.createConversation(agent.id)
  const result = await client.sendMessage({
    conversationId: conversation.id,
    content: 'When should I expect my refund?',
  })
  assert.equal(result.message.content, 'Refund teaching used.')
  assert.equal(result.teachingIds.length, 1)
})
