'use client'

import { useState } from 'react'

import { createAgentAction } from './actions'

type AgentFormProps = {
  readonly ollamaModels: readonly string[]
  readonly ollamaError?: string
}

export function AgentForm({ ollamaModels, ollamaError }: AgentFormProps) {
  const [provider, setProvider] = useState('ollama')
  const [generalKnowledge, setGeneralKnowledge] = useState('')
  const isOllama = provider === 'ollama'
  const isGroq = provider === 'groq'
  const defaultModel = isOllama
    ? (ollamaModels[0] ?? 'llama3.2:3b')
    : isGroq
      ? 'openai/gpt-oss-20b'
      : 'gpt-4.1-mini'

  return (
    <form
      action={createAgentAction}
      className="agent-form settings-card form-stack"
    >
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
      <label>
        General Knowledge — Recommended <span>optional</span>
        <textarea
          name="generalKnowledge"
          rows={6}
          maxLength={10000}
          value={generalKnowledge}
          onChange={(event) => setGeneralKnowledge(event.target.value)}
          placeholder={
            'Delivery takes 5–7 business days.\nReturns are accepted within 14 days.\nWe deliver throughout Nigeria.'
          }
        />
        <small>
          Add information this agent should know about your business, product,
          or topic. {generalKnowledge.length.toLocaleString()} / 10,000
          characters
        </small>
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
            <option value="groq">Groq (Cloud)</option>
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
            placeholder={
              isOllama
                ? 'e.g. llama3.2:3b'
                : isGroq
                  ? 'openai/gpt-oss-20b'
                  : 'gpt-4.1-mini'
            }
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
      ) : isGroq ? (
        <p className="provider-note">
          Groq calls require <code>GROQ_API_KEY</code> in Studio&apos;s
          server-side <code>.env.local</code>. Model availability and limits are
          managed by Groq.
        </p>
      ) : (
        <p className="provider-note">
          OpenAI calls require <code>OPENAI_API_KEY</code> in Studio&apos;s
          server-side <code>.env.local</code>.
        </p>
      )}
      <button className="primary-button" type="submit">
        Create agent
      </button>
    </form>
  )
}
