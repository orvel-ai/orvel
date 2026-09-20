import Link from 'next/link'

import {
  AiSparklesIcon,
  BookOpen01Icon,
  Edit01Icon,
  Message01Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
  SentIcon,
  Settings01Icon,
  TestTube01Icon,
} from '@hugeicons/core-free-icons'
import type {
  AgentDefinition,
  Conversation,
  ConversationMessage,
  EvalCase,
  EvalRun,
  TeachingExample,
} from '@orvel/sdk'

import {
  createEvalAction,
  deleteTeachingAction,
  runEvalAction,
  sendMessageAction,
  startConversationAction,
  updateAgentAction,
} from '../actions'
import { Avatar, Badge, Icon, IconButton } from './ui'
import { KnowledgeEditor } from './knowledge-editor'
import { TeachSheet } from './teach-sheet'

export type WorkspaceTab =
  'chat' | 'knowledge' | 'teachings' | 'evals' | 'settings'

export function AgentHeader({
  agent,
  teachings,
  evals,
}: {
  readonly agent: AgentDefinition
  readonly teachings: number
  readonly evals: number
}) {
  return (
    <header className="agent-identity">
      <div className="breadcrumb">
        <Link href="/agents">Agents</Link>
        <span>/</span>
        <strong>{agent.name}</strong>
      </div>
      <div className="identity-grid">
        <div className="agent-title-row">
          <Avatar name={agent.name} />
          <div>
            <div className="title-status">
              <h1>{agent.name}</h1>
              <Badge tone="active">Active</Badge>
            </div>
            <p>{agent.description ?? agent.instructions}</p>
          </div>
        </div>
        <div className="identity-actions">
          <form action={startConversationAction}>
            <input name="agentId" type="hidden" value={agent.id} />
            <button className="quiet-button" type="submit">
              <Icon icon={PlusSignIcon} size={16} /> New chat
            </button>
          </form>
          <IconButton label="More agent actions">
            <Icon icon={MoreHorizontalIcon} />
          </IconButton>
        </div>
      </div>
      <div className="metadata-pills">
        <Badge>{agent.brain.provider}</Badge>
        <Badge>{agent.brain.model}</Badge>
        <Badge>{teachings} teachings</Badge>
        <Badge>{evals} evals</Badge>
      </div>
    </header>
  )
}

export function AgentTabs({
  agentId,
  active,
}: {
  readonly agentId: string
  readonly active: WorkspaceTab
}) {
  const tabs: readonly [WorkspaceTab, string, typeof Message01Icon][] = [
    ['chat', 'Chat', Message01Icon],
    ['knowledge', 'Knowledge', BookOpen01Icon],
    ['teachings', 'Teachings', AiSparklesIcon],
    ['evals', 'Evaluations', TestTube01Icon],
    ['settings', 'Settings', Settings01Icon],
  ]
  return (
    <nav aria-label="Agent workspace sections" className="workspace-tabs">
      {tabs.map(([id, label, icon]) => (
        <Link
          className={active === id ? 'active' : ''}
          href={
            id === 'chat'
              ? `/agents/${agentId}`
              : `/agents/${agentId}?tab=${id}`
          }
          key={id}
        >
          <Icon icon={icon} size={16} />
          {label}
        </Link>
      ))}
    </nav>
  )
}

export function AgentInspector({
  agent,
  teachings,
  evals,
}: {
  readonly agent: AgentDefinition
  readonly teachings: number
  readonly evals: number
}) {
  return (
    <aside className="inspector" aria-label="Agent details">
      <section className="inspector-card">
        <div className="card-heading">
          <div>
            <p className="kicker">Agent info</p>
            <h2>{agent.name}</h2>
          </div>
          <Link
            aria-label="Edit agent settings"
            className="icon-link"
            href={`/agents/${agent.id}?tab=settings`}
          >
            <Icon icon={Edit01Icon} />
          </Link>
        </div>
        <dl>
          <div>
            <dt>Description</dt>
            <dd>{agent.description ?? agent.instructions}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{agent.brain.provider}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{agent.brain.model}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <i className="status-dot" />
              Active
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>
              {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                agent.createdAt,
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section className="inspector-card">
        <p className="kicker">Quick actions</p>
        <h2>Stay in flow</h2>
        <div className="quick-actions">
          <Link href={`/agents/${agent.id}?tab=teachings`}>
            <Icon icon={AiSparklesIcon} />
            View all teachings <span>{teachings}</span>
          </Link>
          <Link href={`/agents/${agent.id}?tab=evals`}>
            <Icon icon={TestTube01Icon} />
            Create evaluation <span>{evals}</span>
          </Link>
          <Link href={`/agents/${agent.id}?tab=knowledge`}>
            <Icon icon={BookOpen01Icon} />
            Edit knowledge
          </Link>
        </div>
      </section>
    </aside>
  )
}

export function ChatWorkspace({
  agent,
  conversation,
  conversations,
  messages,
  providerReady,
}: {
  readonly agent: AgentDefinition
  readonly conversation?: Conversation | undefined
  readonly conversations: readonly Conversation[]
  readonly messages: readonly ConversationMessage[]
  readonly providerReady: boolean
}) {
  return (
    <section className="chat-workspace">
      <aside className="thread-list">
        <form action={startConversationAction}>
          <input name="agentId" type="hidden" value={agent.id} />
          <button className="new-thread" type="submit">
            <Icon icon={PlusSignIcon} />
            New conversation
          </button>
        </form>
        <div className="thread-heading">Conversations</div>
        {conversations.length === 0 ? (
          <p className="muted-copy">
            Start a new conversation to chat with {agent.name}.
          </p>
        ) : (
          conversations.map((item) => (
            <Link
              className={
                item.id === conversation?.id ? 'thread active' : 'thread'
              }
              href={`/agents/${agent.id}?conversation=${item.id}`}
              key={item.id}
            >
              <span>Conversation</span>
              <small>{time(item.updatedAt)}</small>
            </Link>
          ))
        )}
      </aside>
      <form action={`/agents/${agent.id}`} className="conversation-picker">
        <label>
          Conversation
          <select
            defaultValue={conversation?.id ?? ''}
            name="conversation"
            aria-label="Choose a conversation"
          >
            <option value="">Choose a conversation</option>
            {conversations.map((item, index) => (
              <option key={item.id} value={item.id}>
                Conversation {conversations.length - index}
              </option>
            ))}
          </select>
        </label>
        <button className="quiet-button" type="submit">
          Open
        </button>
      </form>
      <div className="chat-canvas">
        <div className="chat-scroll-region">
          {!providerReady ? (
            <p className="setup-message">
              {agent.brain.provider} is not configured for Studio yet. Add its
              server-side key, then restart Studio.
            </p>
          ) : null}
          {!conversation ? (
            <div className="chat-empty">
              <Avatar name={agent.name} />
              <h2>Ready to help</h2>
              <p>
                Start a conversation with {agent.name}. Teachings and
                creator-provided knowledge are used when relevant.
              </p>
              <form action={startConversationAction}>
                <input name="agentId" type="hidden" value={agent.id} />
                <button className="primary-button" type="submit">
                  Start conversation
                </button>
              </form>
            </div>
          ) : (
            <div className="message-list">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <h2>What can I help with?</h2>
                  <p>Ask a question or test a scenario.</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageCard
                    agent={agent}
                    conversationId={conversation.id}
                    key={message.id}
                    message={message}
                    previousUser={previousUser(messages, index)}
                  />
                ))
              )}
            </div>
          )}
        </div>
        {conversation ? (
          <Composer
            agent={agent}
            conversationId={conversation.id}
            disabled={!providerReady}
          />
        ) : null}
      </div>
    </section>
  )
}

function MessageCard({
  agent,
  conversationId,
  message,
  previousUser,
}: {
  readonly agent: AgentDefinition
  readonly conversationId: string
  readonly message: ConversationMessage
  readonly previousUser?: ConversationMessage | undefined
}) {
  const assistant = message.role === 'assistant'
  return (
    <article className={`chat-message ${assistant ? 'assistant' : 'user'}`}>
      {assistant ? <Avatar compact name={agent.name} /> : null}
      <div className="message-body">
        <div className="message-meta">
          <strong>{assistant ? agent.name : 'You'}</strong>
          <time>{time(message.createdAt)}</time>
        </div>
        <p>{message.content}</p>
        {assistant ? (
          <div className="assistant-tools">
            {message.teachingIds?.length ? (
              <details className="learned-context">
                <summary>
                  <Icon icon={AiSparklesIcon} size={15} />
                  Learned context · {message.teachingIds.length}
                </summary>
                <p>
                  Relevant creator teachings were included for this response.
                </p>
              </details>
            ) : null}
            {previousUser ? (
              <TeachSheet
                agentId={agent.id}
                agentName={agent.name}
                conversationId={conversationId}
                originalResponse={message.content}
                userInput={previousUser.content}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function Composer({
  agent,
  conversationId,
  disabled,
}: {
  readonly agent: AgentDefinition
  readonly conversationId: string
  readonly disabled: boolean
}) {
  return (
    <form action={sendMessageAction} className="premium-composer">
      <input name="agentId" type="hidden" value={agent.id} />
      <input name="conversationId" type="hidden" value={conversationId} />
      <textarea
        disabled={disabled}
        name="content"
        placeholder={`Ask ${agent.name}…`}
        required
        rows={3}
      />
      <div className="composer-footer">
        <span>Teach the agent from any response you want to improve.</span>
        <div>
          <button
            aria-label="Send message"
            className="send-button"
            disabled={disabled}
            type="submit"
          >
            <Icon icon={SentIcon} />
          </button>
        </div>
      </div>
    </form>
  )
}

export function TeachingsPanel({
  agentId,
  teachings,
}: {
  readonly agentId: string
  readonly teachings: readonly TeachingExample[]
}) {
  return (
    <section className="content-panel">
      <div className="section-intro">
        <p className="kicker">Creator corrections</p>
        <h2>Teachings</h2>
        <p>
          Saved examples that help this agent respond better in similar
          situations.
        </p>
      </div>
      {teachings.length === 0 ? (
        <EmptyState
          icon={AiSparklesIcon}
          text="No teachings yet. Use Teach on an assistant response to save a correction."
        />
      ) : (
        <div className="teaching-list">
          {teachings.map((teaching) => (
            <article className="teaching-card" key={teaching.id}>
              <div className="teaching-card-head">
                <Badge>Teaching</Badge>
                <time>{time(teaching.createdAt)}</time>
              </div>
              <div>
                <span>User asked</span>
                <p>{teaching.userInput}</p>
              </div>
              <div>
                <span>Agent originally said</span>
                <p>{teaching.originalResponse}</p>
              </div>
              <div className="taught-answer">
                <span>Creator taught</span>
                <p>{teaching.correctedResponse}</p>
              </div>
              {teaching.explanation ? (
                <div>
                  <span>Why this matters</span>
                  <p>{teaching.explanation}</p>
                </div>
              ) : null}
              <form action={deleteTeachingAction}>
                <input name="agentId" type="hidden" value={agentId} />
                <input name="teachingId" type="hidden" value={teaching.id} />
                <button className="text-button" type="submit">
                  Delete teaching
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function KnowledgePanel({ agent }: { readonly agent: AgentDefinition }) {
  return (
    <section className="content-panel knowledge-panel">
      <div className="section-intro">
        <p className="kicker">Knowledge</p>
        <h2>Information this agent knows from the start.</h2>
        <p>
          Keep how the agent behaves, what it knows, and what you have taught it
          distinct.
        </p>
      </div>
      <div className="knowledge-guide">
        <div>
          <strong>Instructions</strong>
          <span>How the agent behaves.</span>
        </div>
        <div className="featured">
          <strong>Knowledge</strong>
          <span>What the agent knows.</span>
        </div>
        <div>
          <strong>Teachings</strong>
          <span>What the creator has corrected or demonstrated.</span>
        </div>
      </div>
      <KnowledgeEditor agentId={agent.id} value={agent.generalKnowledge} />
    </section>
  )
}

export function EvaluationsPanel({
  agentId,
  evals,
  runs,
  providerReady,
}: {
  readonly agentId: string
  readonly evals: readonly EvalCase[]
  readonly runs: readonly EvalRun[]
  readonly providerReady: boolean
}) {
  const latest = new Map(runs.map((run) => [run.evalId, run]))
  return (
    <section className="content-panel evaluations-panel">
      <div className="section-intro">
        <p className="kicker">Confidence checks</p>
        <h2>Evaluations</h2>
        <p>Test whether your agent continues behaving the way you expect.</p>
      </div>
      <div className="evaluation-grid">
        <form action={createEvalAction} className="settings-card form-stack">
          <input name="agentId" type="hidden" value={agentId} />
          <h3>Create evaluation</h3>
          <label className="field-label">
            Input
            <textarea
              name="input"
              placeholder="When should I expect my refund?"
              required
              rows={3}
            />
          </label>
          <label className="field-label">
            Expected behavior
            <textarea
              name="expected"
              placeholder="5–7 business days"
              required
              rows={3}
            />
          </label>
          <button className="primary-button" type="submit">
            Save evaluation
          </button>
        </form>
        <div className="evaluation-list">
          {evals.length === 0 ? (
            <EmptyState
              icon={TestTube01Icon}
              text="No evaluations yet. Add a repeatable question to check this agent."
            />
          ) : (
            evals.map((item) => {
              const run = latest.get(item.id)
              return (
                <article className="evaluation-card" key={item.id}>
                  <div className="evaluation-card-top">
                    <Badge tone={run?.result.passed ? 'active' : 'neutral'}>
                      {run ? (run.result.passed ? 'Pass' : 'Fail') : 'Not run'}
                    </Badge>
                    <form action={runEvalAction}>
                      <input name="agentId" type="hidden" value={agentId} />
                      <input name="evalId" type="hidden" value={item.id} />
                      <button
                        className="quiet-button"
                        disabled={!providerReady}
                        type="submit"
                      >
                        Run
                      </button>
                    </form>
                  </div>
                  <div>
                    <span>Input</span>
                    <p>{item.input}</p>
                  </div>
                  <div>
                    <span>Expected behavior</span>
                    <p>{item.expected}</p>
                  </div>
                  {run ? <small>{run.result.message}</small> : null}
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export function SettingsPanel({ agent }: { readonly agent: AgentDefinition }) {
  return (
    <section className="content-panel settings-panel">
      <div className="section-intro">
        <p className="kicker">Agent configuration</p>
        <h2>Settings</h2>
        <p>Update the identity, behavior, and brain this agent already uses.</p>
      </div>
      <form action={updateAgentAction} className="settings-form">
        <input name="agentId" type="hidden" value={agent.id} />
        <section className="settings-card">
          <h3>Identity</h3>
          <label className="field-label">
            Name
            <input defaultValue={agent.name} name="name" required />
          </label>
          <label className="field-label">
            Description
            <input
              defaultValue={agent.description}
              name="description"
              placeholder="A short description of this agent"
            />
          </label>
        </section>
        <section className="settings-card">
          <h3>Behavior</h3>
          <label className="field-label">
            Instructions
            <textarea
              defaultValue={agent.instructions}
              name="instructions"
              required
              rows={6}
            />
          </label>
        </section>
        <section className="settings-card">
          <h3>Brain</h3>
          <div className="form-grid">
            <label className="field-label">
              Provider
              <select defaultValue={agent.brain.provider} name="provider">
                <option value="ollama">Ollama</option>
                <option value="groq">Groq</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className="field-label">
              Model
              <input defaultValue={agent.brain.model} name="model" required />
            </label>
          </div>
        </section>
        <div className="settings-save">
          <button className="primary-button" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </section>
  )
}

function EmptyState({
  icon,
  text,
}: {
  readonly icon: typeof AiSparklesIcon
  readonly text: string
}) {
  return (
    <div className="empty-state polished">
      <Icon icon={icon} size={22} />
      <p>{text}</p>
    </div>
  )
}
function previousUser(messages: readonly ConversationMessage[], index: number) {
  return messages
    .slice(0, index)
    .reverse()
    .find((item) => item.role === 'user')
}
function time(value: Date) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(value)
}
