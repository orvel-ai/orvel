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
    accent: 'get started',
    suffix: '',
    prompt: 'Tell me what you can help me with and how to get started.',
  },
  {
    prefix: 'Make answers',
    accent: 'more useful',
    suffix: '',
    prompt: 'What information would help you give me more useful answers?',
  },
  {
    prefix: 'Build an',
    accent: 'evaluation',
    suffix: 'check',
    prompt:
      'Suggest a simple question and expected answer I can use to evaluate you.',
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
          <Icon name="agents" />
          <span className="visually-hidden">Choose an agent</span>
          <select
            aria-label="Choose an agent"
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
        <span className="forge-provider-pill">
          <span className="provider-status-dot" />
          {activeAgent.brain.provider} · {activeAgent.brain.model}
        </span>
      </div>

      <form
        action={startConversationAction}
        className="home-composer forge-home-composer"
      >
        <input name="agentId" type="hidden" value={agentId} />
        <label className="visually-hidden" htmlFor="forge-home-message">
          Message {activeAgent.name}
        </label>
        <textarea
          id="forge-home-message"
          name="content"
          onChange={(event) => setContent(event.target.value)}
          placeholder={`Message ${activeAgent.name}…`}
          required
          rows={2}
          value={content}
        />
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
