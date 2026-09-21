import Link from 'next/link'

import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

import { AgentForm } from '../../agent-form'
import { StudioShell } from '../../components/studio-shell'
import { Icon } from '../../components/ui'
import { getOllamaAvailability, orvel } from '../../lib/orvel'

type PageProps = { searchParams: Promise<{ error?: string }> }

export default async function NewAgentPage({ searchParams }: PageProps) {
  const [agents, ollama, parameters] = await Promise.all([
    orvel.listAgents(),
    getOllamaAvailability(),
    searchParams,
  ])

  return (
    <StudioShell agents={agents} currentSection="agents">
      <main className="home-workspace new-agent-page">
        <Link className="back-link" href="/agents">
          <Icon icon={ArrowLeft01Icon} size={16} /> Back to agents
        </Link>
        <section className="new-agent-intro">
          <p className="kicker">New agent</p>
          <h1>Create an agent that knows your work.</h1>
          <p>
            Start with its purpose, then shape it with knowledge and teachings.
          </p>
        </section>
        {parameters.error ? (
          <p className="alert" role="alert">
            {parameters.error}
          </p>
        ) : null}
        <AgentForm
          ollamaModels={ollama.available ? ollama.models : []}
          {...(!ollama.available ? { ollamaError: ollama.error } : {})}
        />
      </main>
    </StudioShell>
  )
}
