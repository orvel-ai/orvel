import Link from 'next/link'

import { PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'

import { AgentForm } from './agent-form'
import { StudioShell } from './components/studio-shell'
import { Avatar, Icon } from './components/ui'
import { getOllamaAvailability, orvel } from './lib/orvel'

type PageProps = { searchParams: Promise<{ error?: string }> }

export default async function Home({ searchParams }: PageProps) {
  const [agents, parameters, ollama] = await Promise.all([
    orvel.listAgents(),
    searchParams,
    getOllamaAvailability(),
  ])
  return (
    <StudioShell agents={agents}>
      <main className="home-workspace">
        <div className="workspace-topbar">
          <div className="topbar-search">
            <Icon icon={Search01Icon} size={16} />
            <span>Search anything…</span>
            <kbd>⌘ K</kbd>
          </div>
        </div>
        <section className="home-hero">
          <div>
            <p className="kicker">Your workspace</p>
            <h1>Build agents that get better with you.</h1>
            <p>
              Start with the essentials, then refine responses as your agents
              work.
            </p>
          </div>
          <a className="primary-button" href="#new-agent">
            <Icon icon={PlusSignIcon} size={16} />
            Create agent
          </a>
        </section>
        {parameters.error ? (
          <p className="alert" role="alert">
            {parameters.error}
          </p>
        ) : null}
        <section className="agent-home-grid">
          <div className="home-agents">
            <div className="section-heading-row">
              <div>
                <p className="kicker">Your agents</p>
                <h2>Agent workspace</h2>
              </div>
              <span>{agents.length} total</span>
            </div>
            {agents.length === 0 ? (
              <div className="empty-state polished">
                <p>
                  No agents yet. Create one to start a conversation, save
                  teachings, and run evaluations.
                </p>
              </div>
            ) : (
              <div className="home-agent-list">
                {agents.map((agent) => (
                  <Link
                    className="home-agent-card"
                    href={`/agents/${agent.id}`}
                    key={agent.id}
                  >
                    <Avatar name={agent.name} />
                    <div>
                      <h3>{agent.name}</h3>
                      <p>{agent.description ?? agent.instructions}</p>
                      <small>
                        {agent.brain.provider} · {agent.brain.model}
                      </small>
                    </div>
                    <span>Open</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div id="new-agent">
            <AgentForm
              ollamaModels={ollama.available ? ollama.models : []}
              {...(!ollama.available ? { ollamaError: ollama.error } : {})}
            />
          </div>
        </section>
      </main>
    </StudioShell>
  )
}
