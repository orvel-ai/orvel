'use client'

import { useState } from 'react'

import { createAgentAction } from './actions'
import { ModelSelector, type ProviderModelOptions } from './model-selector'

type AgentFormProps = {
  readonly providerOptions: ProviderModelOptions
}

export function AgentForm({ providerOptions }: AgentFormProps) {
  const [generalKnowledge, setGeneralKnowledge] = useState('')
  const initialProvider = providerOptions.ollama.configured
    ? 'ollama'
    : providerOptions.groq.configured
      ? 'groq'
      : providerOptions.openai.configured
        ? 'openai'
        : 'ollama'
  const initialModel =
    providerOptions[initialProvider].models[0] ??
    (initialProvider === 'ollama' ? 'llama3.2:3b' : '')

  return (
    <form action={createAgentAction} className="panel form-stack agent-form">
      <div>
        <p className="eyebrow">New agent</p>
        <h2>Create an agent</h2>
      </div>
      <label>
        Name
        <input name="name" placeholder="SupportBot" required />
      </label>
      <label>
        Description <span>optional</span>
        <input
          name="description"
          placeholder="Handles customer-support questions"
        />
      </label>
      <label>
        Instructions
        <textarea
          name="instructions"
          placeholder="You are a customer support agent. Be clear and accurate."
          required
          rows={5}
        />
      </label>
      <details className="advanced-fields">
        <summary>Advanced configuration</summary>
        <label>
          Knowledge notes <span>optional</span>
          <textarea
            name="generalKnowledge"
            rows={4}
            maxLength={10000}
            value={generalKnowledge}
            onChange={(event) => setGeneralKnowledge(event.target.value)}
            placeholder={
              'Delivery takes 5–7 business days.\nReturns are accepted within 14 days.'
            }
          />
          <small>
            Quick facts for this agent. File, text and URL sources can be added
            later in Knowledge. {generalKnowledge.length.toLocaleString()} /
            10,000 characters
          </small>
        </label>
        <label>
          Visibility
          <select name="visibility" defaultValue="private">
            <option value="private">Private — only in this workspace</option>
            <option value="public" disabled>
              Public — publishing is not available yet
            </option>
          </select>
        </label>
      </details>
      <ModelSelector
        options={providerOptions}
        initialProvider={initialProvider}
        initialModel={initialModel}
      />
      <button type="submit">Create agent</button>
    </form>
  )
}
