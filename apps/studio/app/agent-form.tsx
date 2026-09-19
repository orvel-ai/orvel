'use client'

import { useState } from 'react'

import { createAgentAction } from './actions'

type AgentFormProps = {
  readonly ollamaModels: readonly string[]
  readonly ollamaError?: string
}

export function AgentForm({ ollamaModels, ollamaError }: AgentFormProps) {
  const [provider, setProvider] = useState('ollama')
  const isOllama = provider === 'ollama'
  const defaultModel = isOllama
    ? (ollamaModels[0] ?? 'llama3.2:3b')
    : 'gpt-4.1-mini'

  return (
    <form action={createAgentAction} className="panel form-stack">
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
      <div className="form-row">
        <label>
          Provider
          <select
            name="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <label>
          Model
          <input
            key={provider}
            name="model"
            defaultValue={defaultModel}
            list={isOllama && ollamaModels.length ? 'ollama-models' : undefined}
            placeholder={isOllama ? 'e.g. llama3.2:3b' : 'gpt-4.1-mini'}
            required
          />
          {isOllama && ollamaModels.length ? (
            <datalist id="ollama-models">
              {ollamaModels.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          ) : null}
        </label>
      </div>
      {isOllama ? (
        <p className="provider-note">
          Ollama runs locally and needs to be installed and running.
          {ollamaError ? ` ${ollamaError}` : ' No API key is needed.'}
        </p>
      ) : (
        <p className="provider-note">
          OpenAI calls require <code>OPENAI_API_KEY</code> in Studio&apos;s
          server-side <code>.env.local</code>.
        </p>
      )}
      <button type="submit">Create agent</button>
    </form>
  )
}
