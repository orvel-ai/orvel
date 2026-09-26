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
            <p className="eyebrow">Orvel</p>
            <h1>What would you like to work on?</h1>
            <p className="welcome-copy">
              Choose an agent and start a conversation.
            </p>
            {agents.length ? (
              <form action={startConversationAction} className="home-composer">
                <label className="visually-hidden" htmlFor="home-agent">
                  Choose an agent
                </label>
                <select
                  id="home-agent"
                  name="agentId"
                  defaultValue={agents[0]?.id}
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} · {agent.brain.model}
                    </option>
                  ))}
                </select>
                <label className="visually-hidden" htmlFor="home-message">
                  Message your agent
                </label>
                <textarea
                  id="home-message"
                  name="content"
                  placeholder="Message your agent…"
                  rows={2}
                  required
                />
                <button
                  aria-label="Start conversation"
                  title="Start conversation"
                  type="submit"
                >
                  <Icon name="send" />
                </button>
              </form>
            ) : (
              <Link
                className="button button-primary home-create-agent"
                href="/?view=create"
              >
                <Icon name="plus" /> Create your first agent
              </Link>
            )}
            <div className="home-shortcuts">
              <Link href="/?view=agents">
                <Icon name="agents" /> Browse agents
              </Link>
              <Link href="/?view=create">
                <Icon name="plus" /> Create an agent
              </Link>
            </div>
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
