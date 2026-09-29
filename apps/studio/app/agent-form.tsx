'use client'

import { useState } from 'react'

import { createAgentAction } from './actions'
import { FormSubmitButton } from './form-submit-button'
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
    <form
      action={createAgentAction}
      className="form-stack agent-form new-agent-form"
    >
      <div className="new-agent-intro">
        <p className="eyebrow">Create a project</p>
        <h2>What are you working on?</h2>
        <p>
          Give it a role and clear instructions. Refine it later by chatting and
          teaching it.
        </p>
      </div>
      <label className="agent-name-field">
        Project name
        <input name="name" placeholder="My project" required />
      </label>
      <label className="agent-instructions-field">
        Instructions
        <textarea
          name="instructions"
          placeholder="You help customers understand our returns policy. Be concise and accurate, and ask a follow-up when important details are missing."
          required
          rows={7}
        />
      </label>
      <ModelSelector
        options={providerOptions}
        initialProvider={initialProvider}
        initialModel={initialModel}
      />
      <details className="advanced-fields">
        <summary>Advanced</summary>
        <label>
          Purpose <span>optional</span>
          <input
            name="description"
            placeholder="Customer support for product and order questions"
          />
        </label>
        <label>
          General knowledge <span>optional</span>
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
            Short facts included with every response. Add retrievable text later
            in Knowledge. {generalKnowledge.length.toLocaleString()} / 10,000
            characters
          </small>
        </label>
        <label>
          Visibility
          <select name="visibility" defaultValue="private">
            <option value="private">Private · local workspace</option>
            <option value="public" disabled>
              Public · unavailable
            </option>
          </select>
        </label>
      </details>
      <FormSubmitButton
        className="create-agent-submit"
        label="Create project"
        pendingLabel="Creating project…"
      >
        Create project <span aria-hidden="true">→</span>
      </FormSubmitButton>
    </form>
  )
}
