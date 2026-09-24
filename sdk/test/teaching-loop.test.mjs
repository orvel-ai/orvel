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
    async updateAgent(agent) {
      const index = agents.findIndex((candidate) => candidate.id === agent.id)
      if (index >= 0) agents[index] = agent
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
    async updateConversation(conversation) {
      const index = conversations.findIndex(
        (candidate) => candidate.id === conversation.id,
      )
      if (index >= 0) conversations[index] = conversation
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

test('conversations can be given persistent custom names', async () => {
  const client = createOrvelClient({
    store: createStore(),
    runtime: createRuntime({
      providers: [
        {
          id: 'mock',
          async generate() {
            return { content: 'OK' }
          },
        },
      ],
    }),
    createId: () => 'fixed-id',
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  })
  const agent = await client.createAgent({
    name: 'SupportBot',
    instructions: 'Help customers.',
    model: { provider: 'mock', model: 'mock-1' },
  })
  const conversation = await client.createConversation(agent.id)
  assert.equal(conversation.title, 'New conversation')

  const renamed = await client.renameConversation(
    conversation.id,
    'Refund policy review',
  )
  assert.equal(renamed.title, 'Refund policy review')
  assert.equal(
    (await client.getConversation(conversation.id)).title,
    'Refund policy review',
  )
})

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

test('Groq agents receive general knowledge before distinct relevant teachings', async () => {
  const requests = []
  const runtime = createRuntime({
    providers: [
      {
        id: 'groq',
        async generate(request) {
          requests.push(request)
          return {
            content: request.context.some(
              (item) => item.label === 'Creator-provided general knowledge',
            )
              ? 'We deliver throughout Nigeria.'
              : 'No business facts available.',
          }
        },
      },
    ],
  })
  let nextId = 0
  const client = createOrvelClient({
    store: createStore(),
    runtime,
    createId: () => `knowledge-${++nextId}`,
  })
  const withoutKnowledge = await client.createAgent({
    name: 'Plain agent',
    instructions: 'Help customers.',
    model: { provider: 'groq', model: 'openai/gpt-oss-20b' },
  })
  assert.equal(withoutKnowledge.generalKnowledge, undefined)

  const agent = await client.createAgent({
    name: 'Groq SupportBot',
    instructions: 'Help customers.',
    generalKnowledge: 'We deliver throughout Nigeria.',
    model: { provider: 'groq', model: 'openai/gpt-oss-20b' },
  })
  const updated = await client.updateAgent(agent.id, {
    generalKnowledge: 'We deliver throughout Nigeria. Delivery takes 5–7 days.',
  })
  assert.match(updated.generalKnowledge, /5–7 days/)

  await client.saveTeaching({
    agentId: agent.id,
    userInput: 'How long does delivery take?',
    originalResponse: 'I do not know.',
    correctedResponse: 'Delivery takes 5–7 business days.',
  })
  const conversation = await client.createConversation(agent.id)
  const result = await client.sendMessage({
    conversationId: conversation.id,
    content: 'How long does delivery take in Nigeria?',
  })

  assert.equal(result.message.content, 'We deliver throughout Nigeria.')
  assert.deepEqual(
    requests[0].context.map((item) => item.label),
    [
      'Creator-provided general knowledge',
      'Creator-supplied teaching examples',
    ],
  )
  assert.match(requests[0].context[0].content, /factual reference material/)
  assert.match(requests[0].context[1].content, /Creator-corrected response/)

  const isolatedConversation = await client.createConversation(
    withoutKnowledge.id,
  )
  await client.sendMessage({
    conversationId: isolatedConversation.id,
    content: 'When will my package arrive in Nigeria?',
  })
  assert.deepEqual(requests[1].context, [])
})
