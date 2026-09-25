import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  createEvalAction,
  deleteTeachingAction,
  runEvalAction,
  saveTeachingAction,
  sendMessageAction,
  startConversationAction,
  updateGeneralKnowledgeAction,
  updateAgentAction,
} from '../../actions'
import {
  Icon,
  StudioShell,
  type StudioNavigationAgent,
} from '../../studio-shell'
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

function time(value: Date): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export default async function AgentPage({ params, searchParams }: PageProps) {
  const { agentId } = await params
  const [agent, parameters, allAgents] = await Promise.all([
    orvel.getAgent(agentId),
    searchParams,
    orvel.listAgents(),
  ])
  if (!agent) notFound()

  const tab =
    parameters.tab === 'teachings' ||
    parameters.tab === 'evals' ||
    parameters.tab === 'knowledge' ||
    parameters.tab === 'settings'
      ? parameters.tab
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
  const navigationAgents: StudioNavigationAgent[] = allAgents.map((item) => ({
    id: item.id,
    name: item.name,
    provider: item.brain.provider,
    model: item.brain.model,
    ...(item.id === agentId
      ? {
          conversations: conversations.map((conversationItem) => ({
            id: conversationItem.id,
            label: time(conversationItem.updatedAt),
          })),
        }
      : {}),
  }))

  return (
    <StudioShell
      activeAgentId={agentId}
      agents={navigationAgents}
      currentSection={tab}
      {...(parameters.conversation
        ? { activeConversationId: parameters.conversation }
        : {})}
    >
      <main className="studio-main">
        <section className="agent-header">
          <div>
            <Link className="back-link" href="/">
              ‹ Workspace
            </Link>
            <h1>{agent.name}</h1>
            <p>{agent.description ?? agent.instructions}</p>
          </div>
          <div className="agent-header-actions">
            <div className="model-chip">
              {agent.brain.provider} · {agent.brain.model}
            </div>
            {tab === 'chat' ? (
              <form action={startConversationAction}>
                <input type="hidden" name="agentId" value={agentId} />
                <button className="button button-primary" type="submit">
                  <Icon name="plus" /> New conversation
                </button>
              </form>
            ) : null}
          </div>
        </section>

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

        {tab === 'chat' ? (
          <section className="workspace-grid">
            <div className="chat-panel">
              {!isProviderConfigured(agent.brain.provider) ? (
                <p className="setup-message">
                  {agent.brain.provider === 'groq' ? (
                    <>
                      Groq is not configured. Add <code>GROQ_API_KEY</code> to{' '}
                      <code>.env.local</code> and restart Studio before sending
                      a message.
                    </>
                  ) : (
                    <>
                      OpenAI is not configured. Add <code>OPENAI_API_KEY</code>{' '}
                      to <code>.env.local</code> and restart Studio before
                      sending a message.
                    </>
                  )}
                </p>
              ) : null}
              {agent.brain.provider === 'ollama' &&
              ollama &&
              !ollama.available ? (
                <p className="setup-message">
                  Ollama is unavailable. Install and start Ollama, then pull{' '}
                  <code>{agent.brain.model}</code>. {ollama.error}
                </p>
              ) : null}
              {!conversation ? (
                <div className="empty-chat">
                  <h2>Ready when you are</h2>
                  <p>
                    Create a conversation, then ask SupportBot about refunds.
                  </p>
                </div>
              ) : (
                <>
                  <div className="messages">
                    {messages.length === 0 ? (
                      <p className="empty-state">No messages yet.</p>
                    ) : null}
                    {messages.map((message, index) => {
                      const previousUser = messages
                        .slice(0, index)
                        .reverse()
                        .find((item) => item.role === 'user')
                      return (
                        <article
                          className={`message ${message.role}`}
                          key={message.id}
                        >
                          <p className="message-role">
                            {message.role === 'assistant' ? agent.name : 'You'}
                          </p>
                          <p>{message.content}</p>
                          {message.teachingIds?.length ? (
                            <small>
                              Used {message.teachingIds.length} relevant
                              teaching example
                              {message.teachingIds.length === 1 ? '' : 's'}.
                            </small>
                          ) : null}
                          {message.role === 'assistant' && previousUser ? (
                            <details className="teach-control">
                              <summary>Teach</summary>
                              <form
                                action={saveTeachingAction}
                                className="form-stack compact-form"
                              >
                                <input
                                  type="hidden"
                                  name="agentId"
                                  value={agentId}
                                />
                                <input
                                  type="hidden"
                                  name="conversationId"
                                  value={conversation.id}
                                />
                                <input
                                  type="hidden"
                                  name="userInput"
                                  value={previousUser.content}
                                />
                                <input
                                  type="hidden"
                                  name="originalResponse"
                                  value={message.content}
                                />
                                <p className="original-response">
                                  Original response: {message.content}
                                </p>
                                <label>
                                  Corrected response
                                  <textarea
                                    name="correctedResponse"
                                    required
                                    rows={3}
                                    defaultValue={message.content}
                                  />
                                </label>
                                <label>
                                  Why? <span>optional</span>
                                  <textarea
                                    name="explanation"
                                    rows={2}
                                    placeholder="Explain the correction for future responses."
                                  />
                                </label>
                                <button type="submit">Save teaching</button>
                              </form>
                            </details>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>
                  <form action={sendMessageAction} className="composer">
                    <input type="hidden" name="agentId" value={agentId} />
                    <input
                      type="hidden"
                      name="conversationId"
                      value={conversation.id}
                    />
                    <textarea
                      name="content"
                      required
                      rows={3}
                      placeholder="Ask a question…"
                    />
                    <button
                      type="submit"
                      disabled={!isProviderConfigured(agent.brain.provider)}
                    >
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        ) : null}

        {tab === 'settings' ? (
          <section className="panel">
            <form action={updateAgentAction} className="form-stack agent-form">
              <div>
                <p className="eyebrow">Agent configuration</p>
                <h2>Identity and behavior</h2>
                <p>Changes apply to the agent the next time it runs.</p>
              </div>
              <input type="hidden" name="agentId" value={agentId} />
              <label>
                Name
                <input name="name" defaultValue={agent.name} required />
              </label>
              <label>
                Purpose
                <input
                  name="description"
                  defaultValue={agent.description ?? ''}
                  placeholder="What this agent helps with"
                />
              </label>
              <label>
                Instructions
                <textarea
                  name="instructions"
                  defaultValue={agent.instructions}
                  required
                  rows={8}
                />
              </label>
              <div className="form-row">
                <label>
                  Provider
                  <select name="provider" defaultValue={agent.brain.provider}>
                    <option value="ollama">Ollama · Local</option>
                    <option value="groq">Groq · Cloud</option>
                    <option value="openai">OpenAI · Cloud</option>
                  </select>
                </label>
                <label>
                  Model
                  <input
                    name="model"
                    defaultValue={agent.brain.model}
                    required
                  />
                </label>
              </div>
              <label>
                Visibility
                <select
                  name="visibility"
                  defaultValue={agent.visibility ?? 'private'}
                >
                  <option value="private">Private</option>
                  <option value="public" disabled>
                    Public · publishing is not available yet
                  </option>
                </select>
              </label>
              <button type="submit">Save changes</button>
            </form>
          </section>
        ) : null}

        {tab === 'teachings' ? (
          <section className="panel teachings-panel">
            <div>
              <p className="eyebrow">Saved corrections</p>
              <h2>Teachings</h2>
              <p>Only relevant teachings are retrieved for a later question.</p>
            </div>
            {teachings.length === 0 ? (
              <p className="empty-state">
                No teachings saved yet. Use Teach on an assistant response.
              </p>
            ) : null}
            {teachings.map((teaching) => (
              <article className="teaching-card" key={teaching.id}>
                <small>{time(teaching.createdAt)}</small>
                <h3>User asked</h3>
                <p>{teaching.userInput}</p>
                <h3>Original response</h3>
                <p>{teaching.originalResponse}</p>
                <h3>Correction</h3>
                <p>{teaching.correctedResponse}</p>
                {teaching.explanation ? (
                  <>
                    <h3>Why</h3>
                    <p>{teaching.explanation}</p>
                  </>
                ) : null}
                <form action={deleteTeachingAction}>
                  <input type="hidden" name="agentId" value={agentId} />
                  <input type="hidden" name="teachingId" value={teaching.id} />
                  <button className="text-button" type="submit">
                    Delete
                  </button>
                </form>
              </article>
            ))}
          </section>
        ) : null}

        {tab === 'knowledge' ? (
          <section className="panel">
            <form action={updateGeneralKnowledgeAction} className="form-stack">
              <div>
                <p className="eyebrow">Creator-provided facts</p>
                <h2>General Knowledge</h2>
                <p>
                  Facts this agent should know from the start. This is distinct
                  from instructions and saved teaching examples.
                </p>
              </div>
              <input type="hidden" name="agentId" value={agentId} />
              <label>
                General Knowledge — Recommended <span>optional</span>
                <textarea
                  name="generalKnowledge"
                  rows={10}
                  maxLength={10000}
                  defaultValue={agent.generalKnowledge ?? ''}
                  placeholder={
                    'Delivery takes 5–7 business days.\nReturns are accepted within 14 days.\nWe deliver throughout Nigeria.'
                  }
                />
                <small>
                  Add information this agent should know about your business,
                  product, or topic.{' '}
                  {(agent.generalKnowledge?.length ?? 0).toLocaleString()} /
                  10,000 characters
                </small>
              </label>
              <button type="submit">Save General Knowledge</button>
            </form>
          </section>
        ) : null}

        {tab === 'evals' ? (
          <section className="two-column evals-layout">
            <form action={createEvalAction} className="panel form-stack">
              <div>
                <p className="eyebrow">Deterministic eval</p>
                <h2>Add an eval</h2>
                <p>
                  v0.1 checks whether a response contains expected text. It is
                  not a judgment of general answer quality.
                </p>
              </div>
              <input type="hidden" name="agentId" value={agentId} />
              <label>
                Input
                <textarea
                  name="input"
                  required
                  rows={3}
                  placeholder="When should I expect my refund?"
                />
              </label>
              <label>
                Expected text
                <textarea
                  name="expected"
                  required
                  rows={2}
                  placeholder="5–7 business days"
                />
              </label>
              <button type="submit">Save eval</button>
            </form>
            <div className="panel">
              <p className="eyebrow">Saved evals</p>
              <h2>Run checks</h2>
              {evals.length === 0 ? (
                <p className="empty-state">No evals yet.</p>
              ) : (
                evals.map((evalCase) => (
                  <article className="eval-card" key={evalCase.id}>
                    <p>
                      <strong>Input:</strong> {evalCase.input}
                    </p>
                    <p>
                      <strong>Expected:</strong> {evalCase.expected}
                    </p>
                    <form action={runEvalAction}>
                      <input type="hidden" name="agentId" value={agentId} />
                      <input type="hidden" name="evalId" value={evalCase.id} />
                      <button
                        type="submit"
                        disabled={!isProviderConfigured(agent.brain.provider)}
                      >
                        Run eval
                      </button>
                    </form>
                  </article>
                ))
              )}
            </div>
            <div className="panel eval-runs">
              <p className="eyebrow">Results</p>
              <h2>Recent runs</h2>
              {evalRuns.length === 0 ? (
                <p className="empty-state">No eval runs yet.</p>
              ) : (
                evalRuns.map((run) => (
                  <article className="eval-card" key={run.id}>
                    <p className={run.result.passed ? 'passed' : 'failed'}>
                      {run.result.passed ? 'Passed' : 'Failed'}
                    </p>
                    <p>
                      <strong>Actual:</strong> {run.actual}
                    </p>
                    <small>{run.result.message}</small>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </main>
    </StudioShell>
  )
}
