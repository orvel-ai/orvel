import Link from 'next/link'

import { AgentForm } from './agent-form'
import { getOllamaAvailability, orvel } from './lib/orvel'

type PageProps = { searchParams: Promise<{ error?: string }> }

export default async function Home({ searchParams }: PageProps) {
  const [agents, parameters, ollama] = await Promise.all([
    orvel.listAgents(),
    searchParams,
    getOllamaAvailability(),
  ])

  return (
    <main className="studio-shell">
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="Orvel Studio home">
          Orvel
        </Link>
        <span className="status">v0.1 · Teach</span>
      </header>

      <section className="page-intro">
        <p className="eyebrow">Agents</p>
        <h1>Teach an agent through examples and corrections.</h1>
        <p>
          Create an agent, chat with it, save a correction, then let Orvel
          retrieve relevant teaching for future responses.
        </p>
      </section>

      {parameters.error ? (
        <p className="alert" role="alert">
          {parameters.error}
        </p>
      ) : null}

      <section className="two-column" aria-label="Agent setup">
        <div>
          <h2>Your agents</h2>
          {agents.length === 0 ? (
            <p className="empty-state">
              No agents yet. Create SupportBot to try the teaching loop.
            </p>
          ) : (
            <div className="agent-list">
              {agents.map((agent) => (
                <Link
                  className="agent-card"
                  href={`/agents/${agent.id}`}
                  key={agent.id}
                >
                  <span>{agent.name}</span>
                  <small>
                    {agent.brain.provider} · {agent.brain.model}
                  </small>
                  <p>{agent.description ?? agent.instructions}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <AgentForm
          ollamaModels={ollama.available ? ollama.models : []}
          {...(!ollama.available ? { ollamaError: ollama.error } : {})}
        />
      </section>
    </main>
  )
}
