import Link from 'next/link'

import {
  Activity01Icon,
  AiSparklesIcon,
  Chart02Icon,
  Message01Icon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'

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
  const agentActivity = await Promise.all(
    agents.map(async (agent) => {
      const [conversations, teachings, evalRuns] = await Promise.all([
        orvel.listConversations(agent.id),
        orvel.listTeachings(agent.id),
        orvel.listEvalRuns(agent.id),
      ])
      return { agent, conversations, teachings, evalRuns }
    }),
  )
  const conversations = agentActivity.flatMap((item) => item.conversations)
  const teachings = agentActivity.flatMap((item) => item.teachings)
  const evalRuns = agentActivity.flatMap((item) => item.evalRuns)
  const passedEvals = evalRuns.filter((run) => run.result.passed).length
  const evaluationRate = evalRuns.length
    ? `${Math.round((passedEvals / evalRuns.length) * 100)}%`
    : '—'
  const recentAgents = [...agentActivity]
    .sort(
      (left, right) =>
        right.agent.updatedAt.getTime() - left.agent.updatedAt.getTime(),
    )
    .slice(0, 4)

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
            <p className="kicker">Workspace overview</p>
            <h1>Everything your agents are learning.</h1>
            <p>
              Keep an eye on your agent fleet, its conversations, and the
              feedback that makes each response sharper.
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
        <section aria-label="Workspace statistics" className="overview-stats">
          <article className="overview-stat-card">
            <span className="overview-stat-icon blue">
              <Icon icon={AiSparklesIcon} size={18} />
            </span>
            <div>
              <span>Active agents</span>
              <strong>{agents.length}</strong>
            </div>
          </article>
          <article className="overview-stat-card">
            <span className="overview-stat-icon violet">
              <Icon icon={Message01Icon} size={18} />
            </span>
            <div>
              <span>Conversations</span>
              <strong>{conversations.length}</strong>
            </div>
          </article>
          <article className="overview-stat-card">
            <span className="overview-stat-icon gold">
              <Icon icon={Activity01Icon} size={18} />
            </span>
            <div>
              <span>Teachings saved</span>
              <strong>{teachings.length}</strong>
            </div>
          </article>
          <article className="overview-stat-card">
            <span className="overview-stat-icon green">
              <Icon icon={Chart02Icon} size={18} />
            </span>
            <div>
              <span>Evaluation pass rate</span>
              <strong>{evaluationRate}</strong>
            </div>
          </article>
        </section>
        <section className="overview-grid">
          <div className="overview-panel agent-overview-panel">
            <div className="section-heading-row">
              <div>
                <p className="kicker">Agent fleet</p>
                <h2>Recently active agents</h2>
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
                {recentAgents.map(({ agent, conversations, teachings }) => (
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
                        {conversations.length} conversations ·{' '}
                        {teachings.length} teachings
                      </small>
                    </div>
                    <span>Open</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <aside className="overview-panel overview-guide">
            <p className="kicker">How it works</p>
            <h2>A better answer loop</h2>
            <ol>
              <li>
                <span>1</span>
                <p>
                  <strong>Start a conversation</strong>
                  Test how your agent handles real questions.
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  <strong>Save a teaching</strong>
                  Turn a correction into lasting context.
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  <strong>Run evaluations</strong>
                  Check that the right behavior holds up.
                </p>
              </li>
            </ol>
          </aside>
        </section>
        <section className="create-agent-section" id="new-agent">
          <div className="section-heading-row">
            <div>
              <p className="kicker">New agent</p>
              <h2>Create an agent</h2>
            </div>
            <span>Set up in a few steps</span>
          </div>
          <AgentForm
            ollamaModels={ollama.available ? ollama.models : []}
            {...(!ollama.available ? { ollamaError: ollama.error } : {})}
          />
        </section>
      </main>
    </StudioShell>
  )
}
