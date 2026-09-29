'use client'

import { useState } from 'react'

import { startConversationAction } from './actions'
import { FormSubmitButton } from './form-submit-button'
import { Icon } from './studio-shell'

type WelcomeAgent = {
  readonly id: string
  readonly name: string
  readonly brain: {
    readonly provider: string
    readonly model: string
  }
}

const suggestions = [
  {
    prefix: 'Help me',
    accent: 'scaffold a',
    suffix: 'new feature',
    prompt: 'Help me scaffold a new feature.',
  },
  {
    prefix: 'Surprise me with a',
    accent: 'brilliant',
    suffix: 'idea',
    prompt: 'Surprise me with a brilliant idea.',
  },
  {
    prefix: 'Recommend areas to',
    accent: 'improve our',
    suffix: 'tests',
    prompt: 'Recommend areas to improve our tests.',
  },
]

export function ForgeWelcomeComposer({
  agents,
}: {
  readonly agents: readonly WelcomeAgent[]
}) {
  const [agentId, setAgentId] = useState(agents[0]?.id ?? '')
  const [content, setContent] = useState('')
  const activeAgent = agents.find((agent) => agent.id === agentId) ?? agents[0]

  if (!activeAgent) return null

  return (
    <div className="forge-welcome-composer-wrap">
      <div className="forge-composer-context">
        <label className="forge-select-agent">
          <Icon name="folder" />
          <span className="visually-hidden">Select folder</span>
          <select
            aria-label="Select folder"
            onChange={(event) => setAgentId(event.target.value)}
            value={agentId}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <span className="context-chevron" aria-hidden="true">
            ⌄
          </span>
        </label>
        <span
          className="forge-provider-pill"
          aria-label={`${activeAgent.brain.provider === 'ollama' ? 'Local' : 'Cloud'} runtime`}
        >
          <Icon name="desktop" />
          {activeAgent.brain.provider === 'ollama' ? 'Local' : 'Cloud'}{' '}
          <span aria-hidden="true">⌄</span>
        </span>
      </div>

      <form
        action={startConversationAction}
        className="home-composer forge-home-composer"
      >
        <input name="agentId" type="hidden" value={agentId} />
        <label className="visually-hidden" htmlFor="forge-home-message">
          Describe what you want to build
        </label>
        <textarea
          id="forge-home-message"
          name="content"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Create a project management app like Trello..."
          required
          rows={2}
          value={content}
        />
        <span className="forge-composer-model" title={activeAgent.brain.model}>
          {activeAgent.brain.model} <span aria-hidden="true">⌄</span>
        </span>
        <FormSubmitButton
          label="Send message"
          pendingLabel="Sending message"
          pendingStyle="spinner"
          title="Send message"
        >
          <Icon name="send" />
        </FormSubmitButton>
      </form>

      <div aria-label="Prompt suggestions" className="forge-suggestions">
        {suggestions.map((suggestion) => (
          <button
            className="forge-suggestion"
            key={suggestion.prompt}
            onClick={() => setContent(suggestion.prompt)}
            type="button"
          >
            <span>
              {suggestion.prefix} <strong>{suggestion.accent}</strong>
              {suggestion.suffix ? ` ${suggestion.suffix}` : ''}
            </span>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
    </div>
  )
}
