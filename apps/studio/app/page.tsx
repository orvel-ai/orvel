import Link from 'next/link'

import { AgentForm } from './agent-form'
import { ForgeWelcomeComposer } from './forge-welcome-composer'
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
                <path d="M24 56c0-20 15-35 36-36 21-1 37 13 39 34 2 13-3 27-12 36-7 7-16 11-28 11-11 0-22-4-29-12-7-8-10-20-6-33Z" />
                <path d="M27 43c-8-7-7-18 0-21 8-3 16 4 19 13m29-1c5-9 14-15 21-10 6 5 3 15-4 21M22 48l34 3 1-30 13 1 2 29 29-5M57 22l4-7 9 1 3 8" />
                <path d="M41 65h1m36-1h1m-31 20c7 7 17 8 24 1m-23-8-7 1m47-1-8-1m-39-3-12-3m59 3 12-3m-53 20 2 12 9 3 6-2 5-12" />
                <circle cx="44" cy="65" r="4" stroke="#df7445" />
                <circle cx="78" cy="64" r="4" stroke="#df7445" />
                <path d="m57 77 5-3 6 3-5 6-6-6Z" />
              </svg>
            </div>
            <ForgeWelcomeComposer agents={agents} />
            {!agents.length ? (
              <Link className="button button-primary" href="/?view=create">
                <Icon name="plus" /> Create a project
              </Link>
            ) : null}
          </section>
        ) : null}

        {view === 'agents' ? (
          <>
            <header className="page-header">
              <div>
                <p className="eyebrow">Workspace</p>
                <h1>Projects</h1>
                <p>Open a project or start something new.</p>
              </div>
              <Link className="button button-primary" href="/?view=create">
                <Icon name="plus" /> New project
              </Link>
            </header>
            <section aria-label="Your projects" className="agents-grid">
              {agents.length === 0 ? (
                <div className="empty-panel">
                  <strong>Create your first project</strong>
                  <p>Give it a name and purpose to get started.</p>
                  <Link className="button button-primary" href="/?view=create">
                    Create a project
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
                      Open project <Icon name="chevron" />
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
                <h1>New project</h1>
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
