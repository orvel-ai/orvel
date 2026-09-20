import Link from 'next/link'

import { PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'

import { StudioShell } from '../components/studio-shell'
import { Avatar, Icon } from '../components/ui'
import { orvel } from '../lib/orvel'

export default async function AgentsPage() {
  const agents = await orvel.listAgents()
  const activity = await Promise.all(
    agents.map(async (agent) => {
      const [conversations, teachings] = await Promise.all([
        orvel.listConversations(agent.id),
        orvel.listTeachings(agent.id),
      ])
      return {
        agent,
        conversations: conversations.length,
        teachings: teachings.length,
      }
    }),
  )

  return (
    <StudioShell agents={agents} currentSection="agents">
      <main className="home-workspace agents-directory">
        <div className="workspace-topbar">
          <div className="topbar-search">
            <Icon icon={Search01Icon} size={16} />
            <span>Search agents…</span>
            <kbd>⌘ K</kbd>
          </div>
        </div>
        <section className="home-hero agents-directory-hero">
          <div>
            <p className="kicker">Your agent fleet</p>
            <h1>Choose an agent to work with.</h1>
            <p>
              Open an agent workspace to chat, save teachings, and run
              evaluations.
            </p>
          </div>
          <Link className="primary-button" href="/#new-agent">
            <Icon icon={PlusSignIcon} size={16} />
            Create agent
          </Link>
        </section>
        <section className="agents-directory-panel">
          <div className="section-heading-row">
            <div>
              <p className="kicker">All agents</p>
              <h2>
                {agents.length
                  ? `${agents.length} ${agents.length === 1 ? 'agent' : 'agents'}`
                  : 'No agents yet'}
              </h2>
            </div>
          </div>
          {agents.length === 0 ? (
            <div className="empty-state polished">
              <p>
                Create your first agent from the Home overview to get started.
              </p>
            </div>
          ) : (
            <div className="agents-directory-grid">
              {activity.map(({ agent, conversations, teachings }) => (
                <Link
                  className="directory-agent-card"
                  href={`/agents/${agent.id}`}
                  key={agent.id}
                >
                  <Avatar name={agent.name} />
                  <div>
                    <h3>{agent.name}</h3>
                    <p>{agent.description ?? agent.instructions}</p>
                    <small>
                      {agent.brain.provider} · {conversations} conversations ·{' '}
                      {teachings} teachings
                    </small>
                  </div>
                  <span>Open workspace →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </StudioShell>
  )
}
