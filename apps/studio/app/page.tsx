import Link from 'next/link'

import { AgentForm } from './agent-form'
import { Icon, StudioShell, type StudioNavigationAgent } from './studio-shell'
import {
  getOllamaAvailability,
  getProviderAvailability,
  isProviderConfigured,
  orvel,
} from './lib/orvel'
import type { ProviderModelOptions } from './model-selector'
import { createStudioNavigation } from './lib/studio-navigation'

type PageProps = {
  searchParams: Promise<{ error?: string; view?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  const [agents, parameters] = await Promise.all([
    orvel.listAgents(),
    searchParams,
  ])
  const navigationAgents: StudioNavigationAgent[] =
    await createStudioNavigation(agents)
  const view = ['agents', 'create', 'settings'].includes(parameters.view ?? '')
    ? parameters.view!
    : 'welcome'
  const [ollama, providerOptions] = await Promise.all([
    view === 'settings' ? getOllamaAvailability() : Promise.resolve(undefined),
    view === 'create' ? getProviderAvailability() : Promise.resolve(undefined),
  ])

  return (
    <StudioShell currentSection={view} agents={navigationAgents}>
      <main
        className={`studio-main${view === 'welcome' ? ' welcome-main' : ''}`}
      >
        {view === 'welcome' ? (
          <section className="welcome-screen">
            <p className="eyebrow">Orvel Studio</p>
            <h1>Welcome to your workspace</h1>
            <p className="welcome-copy">
              Choose an agent from the sidebar to open its conversations,
              knowledge, feedback, and evaluations.
            </p>
            <div className="welcome-actions">
              <Link className="welcome-action-card" href="/?view=create">
                <Icon name="plus" />
                <span>
                  <strong>Create an agent</strong>
                  <small>Set up a new agent for this workspace</small>
                </span>
                <Icon name="chevron" />
              </Link>
              <Link className="welcome-action-card" href="/?view=agents">
                <Icon name="agents" />
                <span>
                  <strong>Browse agents</strong>
                  <small>See and manage the agents you have created</small>
                </span>
                <Icon name="chevron" />
              </Link>
            </div>
            {!agents.length ? (
              <p className="welcome-agent-hint">
                Create an agent to start a conversation.
              </p>
            ) : null}
          </section>
        ) : null}

        {view === 'agents' ? (
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">Workspace</p>
                <h1>Agents</h1>
                <p>Create, configure, and work with your agents.</p>
              </div>
              <Link className="button button-primary" href="/?view=create">
                <Icon name="plus" /> Create agent
              </Link>
            </header>
            <section aria-label="Your agents" className="agents-grid">
              {agents.length === 0 ? (
                <div className="empty-panel">
                  <strong>Create your first agent</strong>
                  <p>
                    Give it a name, purpose, and instructions to get started.
                  </p>
                  <Link className="button button-primary" href="/?view=create">
                    Create agent
                  </Link>
                </div>
              ) : (
                agents.map((agent) => (
                  <Link
                    className="agent-card"
                    href={`/agents/${agent.id}?tab=overview`}
                    key={agent.id}
                  >
                    <span
                      className={`agent-avatar ${agent.id === 'research' ? 'avatar-dark' : agent.id === 'marketing' ? 'avatar-violet' : ''}`}
                    >
                      {agent.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="agent-card-content">
                      <strong>{agent.name}</strong>
                      <span>{agent.description || agent.instructions}</span>
                      <small>
                        {agent.brain.provider} · {agent.brain.model}
                      </small>
                    </span>
                    <span className="agent-open-label">
                      Open agent <Icon name="chevron" />
                    </span>
                  </Link>
                ))
              )}
            </section>
          </>
        ) : null}

        {view === 'create' ? (
          <>
            <header className="page-header">
              <div>
                <Link className="back-link" href="/">
                  ‹ Workspace
                </Link>
                <h1>New agent</h1>
                <p>Give it a name, purpose, and clear instructions.</p>
              </div>
              <Link className="button button-quiet" href="/">
                Cancel
              </Link>
            </header>
            {parameters.error ? (
              <p className="alert" role="alert">
                {parameters.error}
              </p>
            ) : null}
            <AgentForm
              providerOptions={providerOptions as ProviderModelOptions}
            />
          </>
        ) : null}

        {view === 'settings' ? (
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">Workspace</p>
                <h1>Settings</h1>
                <p>Configure providers for your local Studio.</p>
              </div>
            </header>
            <section className="settings-grid" aria-label="Model providers">
              <article className="settings-card">
                <span className="provider-icon provider-green">O</span>
                <div>
                  <strong>Ollama</strong>
                  <p>
                    Run models on this machine. Start Ollama and pull a model to
                    use it.
                  </p>
                  <small
                    className={
                      ollama?.available ? 'status-ready' : 'status-offline'
                    }
                  >
                    {ollama?.available
                      ? `${ollama.models.length} model${ollama.models.length === 1 ? '' : 's'} available`
                      : 'Not available'}
                  </small>
                </div>
              </article>
              <article className="settings-card">
                <span className="provider-icon provider-violet">G</span>
                <div>
                  <strong>Groq</strong>
                  <p>
                    Connect Groq by setting <code>GROQ_API_KEY</code> in
                    Studio&apos;s <code>.env.local</code>.
                  </p>
                  <small
                    className={
                      isProviderConfigured('groq')
                        ? 'status-ready'
                        : 'status-offline'
                    }
                  >
                    {isProviderConfigured('groq')
                      ? 'Configured'
                      : 'Needs setup'}
                  </small>
                </div>
              </article>
              <article className="settings-card">
                <span className="provider-icon provider-dark">O</span>
                <div>
                  <strong>OpenAI</strong>
                  <p>
                    Connect OpenAI by setting <code>OPENAI_API_KEY</code> in
                    Studio&apos;s <code>.env.local</code>.
                  </p>
                  <small
                    className={
                      isProviderConfigured('openai')
                        ? 'status-ready'
                        : 'status-offline'
                    }
                  >
                    {isProviderConfigured('openai')
                      ? 'Configured'
                      : 'Needs setup'}
                  </small>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </main>
    </StudioShell>
  )
}
