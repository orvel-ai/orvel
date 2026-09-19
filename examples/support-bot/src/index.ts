import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createFileStore } from '@orvel/local'
import {
  createOrvelClient,
  createRuntime,
  type ModelProvider,
} from '@orvel/sdk'

const directory = await mkdir(join(tmpdir(), 'orvel-support-bot-demo'), {
  recursive: true,
}).then(() => join(tmpdir(), 'orvel-support-bot-demo'))
const dataPath = join(directory, 'data.json')

const demoProvider: ModelProvider = {
  id: 'demo',
  async generate(request) {
    const correction = request.context[0]?.content.match(
      /Creator-corrected response: (.+)/,
    )?.[1]
    return { content: correction ?? 'I am not sure how long refunds take.' }
  },
}

const client = createOrvelClient({
  store: createFileStore(dataPath),
  runtime: createRuntime({ providers: [demoProvider] }),
})

const supportBot = await client.createAgent({
  name: 'SupportBot',
  instructions: 'You are a customer support agent.',
  model: { provider: 'demo', model: 'demo-model' },
})
const firstConversation = await client.createConversation(supportBot.id)
const first = await client.sendMessage({
  conversationId: firstConversation.id,
  content: 'How long do refunds take?',
})

await client.saveTeaching({
  agentId: supportBot.id,
  conversationId: firstConversation.id,
  userInput: 'How long do refunds take?',
  originalResponse: first.message.content,
  correctedResponse: 'Refunds normally take 5–7 business days.',
  explanation: 'Never tell customers refunds are instant.',
})

const secondConversation = await client.createConversation(supportBot.id)
const learned = await client.sendMessage({
  conversationId: secondConversation.id,
  content: 'When should I expect my refund?',
})

console.log(learned.message.content)
console.log(`Teaching used: ${learned.teachingIds.join(', ')}`)

await rm(directory, { recursive: true, force: true })
