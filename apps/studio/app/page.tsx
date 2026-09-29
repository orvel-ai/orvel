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
    <StudioShell
      currentSection={view}
      agents={navigationAgents}
      landing={view === 'welcome'}
    >
      <main className="studio-main">
        {view === 'welcome' ? (
          <section className="welcome-screen">
            <div aria-hidden="true" className="forge-welcome-emblem">
              <svg viewBox="0 0 120 120" fill="none">
                <path d="M28 91c-9-7-11-19-8-29 2-7 6-12 12-16l-3-17 18 8c9-4 22-4 31 1l18-9-3 20c6 7 9 15 8 25-2 18-17 31-38 33-14 1-27-5-35-16Z" />
                <path d="m40 48-9-16 18 7m30 6 14-15-1 23M41 68h1m34-2h1m-25 15c7 6 16 7 23 1m-20 14 4 12 9-1 4-14" />
                <path d="m21 88-9 7m86-12 10 5M55 28l5-12 8 12" />
              </svg>
            </div>
            <p className="eyebrow">ORVEL STUDIO</p>
            <h1>Welcome</h1>
            <p className="welcome-copy">
              No view is open. Select an agent in the Explorer or start
              something new.
            </p>
            <div className="welcome-actions">
              <Link className="welcome-action-card" href="/?view=create">
                <Icon name="plus" />
                <span>
                  <strong>Create an agent</strong>
                  <small>Set up a new agent for your workspace</small>
                </span>
                <Icon name="chevron" />
              </Link>
              <Link className="welcome-action-card" href="/?view=agents">
                <Icon name="agents" />
                <span>
                  <strong>Browse agents</strong>
                  <small>See all agents in this workspace</small>
                </span>
                <Icon name="chevron" />
              </Link>
            </div>
            {agents.length ? (
              <p className="welcome-agent-hint">
                Or choose an agent in the Explorer to open it in this workspace.
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
                <p>Create and manage your AI agents.</p>
              </div>
              <Link className="button button-primary" href="/?view=create">
                <Icon name="plus" /> New agent
              </Link>
            </header>
            <section aria-label="Your agents" className="agents-grid">
              {agents.length === 0 ? (
                <div className="empty-panel">
                  <strong>Create your first agent</strong>
                  <p>Give it a name and purpose to get started.</p>
                  <Link className="button button-primary" href="/?view=create">
                    Create an agent
                  </Link>
                </div>
              ) : (
                agents.map((agent) => (
                  <Link
                    className="agent-card"
                    href={`/agents/${agent.id}?tab=playground`}
                    key={agent.id}
                  >
                    <span
                      className={`agent-avatar ${agent.id === 'research' ? 'avatar-dark' : agent.id === 'marketing' ? 'avatar-violet' : ''}`}
                    >
                      {agent.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="agent-card-content">
                      <strong>{agent.name}</strong>
                      <span>{agent.description ?? agent.instructions}</span>
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
                <p>Start with a name and a clear purpose.</p>
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
