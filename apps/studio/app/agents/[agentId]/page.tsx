import { notFound } from 'next/navigation'

import {
  AgentHeader,
  AgentInspector,
  AgentTabs,
  ChatWorkspace,
  EvaluationsPanel,
  KnowledgePanel,
  SettingsPanel,
  TeachingsPanel,
  type WorkspaceTab,
} from '../../components/agent-workspace'
import { StudioShell } from '../../components/studio-shell'
import {
  getOllamaAvailability,
  isProviderConfigured,
  orvel,
} from '../../lib/orvel'

type PageProps = {
  params: Promise<{ agentId: string }>
  searchParams: Promise<{
    tab?: string
    conversation?: string
    error?: string
    notice?: string
  }>
}

const tabs: readonly WorkspaceTab[] = [
  'chat',
  'knowledge',
  'teachings',
  'evals',
  'settings',
]

export default async function AgentPage({ params, searchParams }: PageProps) {
  const { agentId } = await params
  const [agent, parameters, agents] = await Promise.all([
    orvel.getAgent(agentId),
    searchParams,
    orvel.listAgents(),
  ])
  if (!agent) notFound()
  const tab = tabs.includes(parameters.tab as WorkspaceTab)
    ? (parameters.tab as WorkspaceTab)
    : 'chat'
  const [conversations, teachings, evals, evalRuns, ollama] = await Promise.all(
    [
      orvel.listConversations(agentId),
      orvel.listTeachings(agentId),
      orvel.listEvals(agentId),
      orvel.listEvalRuns(agentId),
      agent.brain.provider === 'ollama'
        ? getOllamaAvailability()
        : Promise.resolve(undefined),
    ],
  )
  const conversation =
    conversations.find((item) => item.id === parameters.conversation) ??
    conversations[0]
  const messages = conversation ? await orvel.listMessages(conversation.id) : []
  const providerReady =
    isProviderConfigured(agent.brain.provider) &&
    (agent.brain.provider !== 'ollama' || ollama?.available !== false)

  return (
    <StudioShell agents={agents} selectedAgentId={agent.id}>
      <div className="workspace-topbar">
        <div className="topbar-search">
          <span>Search anything…</span>
          <kbd>⌘ K</kbd>
        </div>
      </div>
      <main className="agent-workspace-shell">
        <AgentHeader
          agent={agent}
          evals={evals.length}
          teachings={teachings.length}
        />
        <AgentTabs active={tab} agentId={agent.id} />
        {parameters.error ? (
          <p className="alert" role="alert">
            {parameters.error}
          </p>
        ) : null}
        {parameters.notice ? (
          <p className="notice-success" role="status">
            {parameters.notice}
          </p>
        ) : null}
        <div className="workspace-body">
          <div className="workspace-main">
            {tab === 'chat' ? (
              <ChatWorkspace
                agent={agent}
                {...(conversation ? { conversation } : {})}
                conversations={conversations}
                messages={messages}
                providerReady={providerReady}
              />
            ) : null}
            {tab === 'knowledge' ? <KnowledgePanel agent={agent} /> : null}
            {tab === 'teachings' ? (
              <TeachingsPanel agentId={agent.id} teachings={teachings} />
            ) : null}
            {tab === 'evals' ? (
              <EvaluationsPanel
                agentId={agent.id}
                evals={evals}
                providerReady={providerReady}
                runs={evalRuns}
              />
            ) : null}
            {tab === 'settings' ? <SettingsPanel agent={agent} /> : null}
          </div>
          <AgentInspector
            agent={agent}
            evals={evals.length}
            teachings={teachings.length}
          />
        </div>
      </main>
    </StudioShell>
  )
}
