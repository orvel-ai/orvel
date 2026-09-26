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
import { startConversationAction } from './actions'

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
      <main className="studio-main">
        {view === 'welcome' ? (
          <section className="welcome-screen">
            <div className="welcome-brand">
              <Icon name="agents" />
            </div>
            <p className="eyebrow">Orvel Studio</p>
            <h1>What are we working on?</h1>
            <p className="welcome-copy">
              Start a conversation with one of your agents, or create a new
              agent for a different task.
            </p>
            <div className="welcome-actions">
              {agents[0] ? (
                <form action={startConversationAction}>
                  <input name="agentId" type="hidden" value={agents[0].id} />
                  <button className="welcome-action" type="submit">
                    <Icon name="plus" />
                    <span>
                      <strong>Start a chat</strong>
                      <small>
                        Open a new conversation with {agents[0].name}
                      </small>
                    </span>
                    <Icon name="chevron" />
                  </button>
                </form>
              ) : (
                <Link className="welcome-action" href="/?view=create">
                  <Icon name="plus" />
                  <span>
                    <strong>Create an agent</strong>
                    <small>Set up a new agent for your workspace</small>
                  </span>
                  <Icon name="chevron" />
                </Link>
              )}
              <Link className="welcome-action" href="/?view=agents">
                <Icon name="agents" />
                <span>
                  <strong>Browse agents</strong>
                  <small>See all agents in this workspace</small>
                </span>
                <Icon name="chevron" />
              </Link>
            </div>
            <p className="welcome-hint">
              Your recent conversations are in the sidebar.
            </p>
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
                    href={`/agents/${agent.id}`}
                    key={agent.id}
                  >
                    <span
                      className={`agent-avatar ${agent.id === 'research' ? 'avatar-dark' : agent.id === 'marketing' ? 'avatar-violet' : ''}`}
                    >
                      {agent.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="agent-card-content">
                      <strong>{agent.name}</strong>
                      <small>
                        {agent.brain.provider} · {agent.brain.model}
                      </small>
                      <span>{agent.description ?? agent.instructions}</span>
                    </span>
                    <Icon name="chevron" />
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
