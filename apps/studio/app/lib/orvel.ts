import { join } from 'node:path'

import { createFileStore } from '@orvel/local'
import { createOpenAIProvider } from '@orvel/openai'
import { createOrvelClient, createRuntime } from '@orvel/sdk'

const dataPath =
  process.env.ORVEL_DATA_PATH ?? join(process.cwd(), '.orvel', 'data.json')
const store = createFileStore(dataPath)
const openAIKey = process.env.OPENAI_API_KEY
const runtime = createRuntime({
  providers: [createOpenAIProvider(openAIKey ? { apiKey: openAIKey } : {})],
})

export const orvel = createOrvelClient({ store, runtime })
export const isProviderConfigured = Boolean(openAIKey)
