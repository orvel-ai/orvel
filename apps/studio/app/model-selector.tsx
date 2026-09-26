'use client'

import { useState } from 'react'

export type ProviderModelOptions = Readonly<
  Record<
    'ollama' | 'groq' | 'openai',
    {
      readonly configured: boolean
      readonly models: readonly string[]
      readonly error?: string
    }
  >
>

type ModelSelectorProps = {
  readonly options: ProviderModelOptions
  readonly initialProvider: string
  readonly initialModel: string
}

const providers = [
  { id: 'ollama', label: 'Ollama · Local' },
  { id: 'groq', label: 'Groq · Cloud' },
  { id: 'openai', label: 'OpenAI · Cloud' },
] as const

export function ModelSelector({
  options,
  initialProvider,
  initialModel,
}: ModelSelectorProps) {
  const [provider, setProvider] = useState(initialProvider)
  const [model, setModel] = useState(initialModel)
  const providerOptions = options[provider as keyof ProviderModelOptions] ?? {
    configured: false,
    models: [],
  }
  const discovered = providerOptions.models
  const modelIsDiscovered = discovered.includes(model)

  function changeProvider(nextProvider: string) {
    setProvider(nextProvider)
    setModel(
      options[nextProvider as keyof ProviderModelOptions]?.models[0] ?? '',
    )
  }

  return (
    <div className="model-selector">
      <div className="form-row">
        <label>
          Provider
          <select
            name="provider"
            onChange={(event) => changeProvider(event.target.value)}
            value={provider}
          >
            {!providers.some((item) => item.id === provider) ? (
              <option value={provider}>{provider} · current setting</option>
            ) : null}
            {providers.map((item) => {
              const available = options[item.id]
              const status = available.configured
                ? available.models.length
                  ? `${available.models.length} models`
                  : 'configured'
                : 'not connected'
              return (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={
                    !available.configured &&
                    item.id !== initialProvider &&
                    item.id !== 'ollama'
                  }
                >
                  {item.label} · {status}
                </option>
              )
            })}
          </select>
        </label>
        <label>
          Model
          {discovered.length ? (
            <select
              name="model"
              onChange={(event) => setModel(event.target.value)}
              required
              value={model}
            >
              {!modelIsDiscovered && model ? (
                <option value={model}>Saved model · {model}</option>
              ) : null}
              {discovered.map((modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              ))}
            </select>
          ) : (
            <input
              autoComplete="off"
              name="model"
              onChange={(event) => setModel(event.target.value)}
              placeholder={
                provider === 'ollama' ? 'e.g. llama3.2:3b' : 'Provider model ID'
              }
              required
              value={model}
            />
          )}
        </label>
      </div>
      {!providerOptions.configured ? (
        <p className="provider-note">
          {providerOptions.error ??
            'This provider is not connected in the current Studio workspace.'}
        </p>
      ) : providerOptions.error ? (
        <p className="provider-note">{providerOptions.error}</p>
      ) : discovered.length ? (
        <p className="provider-note">
          Models loaded from the connected provider. Model access is verified
          when the agent runs.
        </p>
      ) : (
        <p className="provider-note">
          No models were returned. Enter a model ID available to this provider.
        </p>
      )}
    </div>
  )
}
