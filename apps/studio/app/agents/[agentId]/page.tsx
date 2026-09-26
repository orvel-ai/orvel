import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  addKnowledgeTextAction,
  addKnowledgeUrlAction,
  createEvalAction,
  deleteKnowledgeAction,
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
  getProviderAvailability,
  getOllamaAvailability,
  isProviderConfigured,
  orvel,
} from '../../lib/orvel'
import { ModelSelector, type ProviderModelOptions } from '../../model-selector'
import { DeleteAgentControl } from '../../delete-agent-control'

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
    parameters.tab === 'overview' ||
    parameters.tab === 'playground' ||
    parameters.tab === 'chat' ||
    parameters.tab === 'teachings' ||
    parameters.tab === 'evals' ||
    parameters.tab === 'knowledge' ||
    parameters.tab === 'settings'
      ? parameters.tab === 'chat'
        ? 'playground'
        : parameters.tab
      : 'overview'
  const [
    conversations,
    teachings,
    evals,
    evalRuns,
    knowledge,
    ollama,
    providerOptions,
  ] = await Promise.all([
    orvel.listConversations(agentId),
    orvel.listTeachings(agentId),
    orvel.listEvals(agentId),
    orvel.listEvalRuns(agentId),
    orvel.listKnowledge(agentId),
    tab === 'playground' && agent.brain.provider === 'ollama'
      ? getOllamaAvailability()
      : Promise.resolve(undefined),
    tab === 'settings' ? getProviderAvailability() : Promise.resolve(undefined),
  ])
  const conversation =
    conversations.find((item) => item.id === parameters.conversation) ??
    conversations[0]
  const messages = conversation ? await orvel.listMessages(conversation.id) : []
  const conversationTitles = await Promise.all(
    conversations.map(async (conversationItem) => {
      const conversationMessages = await orvel.listMessages(conversationItem.id)
      const firstUserMessage = conversationMessages.find(
        (message) => message.role === 'user',
      )
      const title = firstUserMessage?.content.replace(/\s+/g, ' ').trim()
      return {
        id: conversationItem.id,
        label:
          conversationItem.title ??
          (title
            ? title.length > 38
              ? `${title.slice(0, 37)}…`
              : title
            : 'New conversation'),
        updatedAt: time(conversationItem.updatedAt),
      }
    }),
  )
  const navigationAgents: StudioNavigationAgent[] = allAgents.map((item) => ({
    id: item.id,
    name: item.name,
    provider: item.brain.provider,
    model: item.brain.model,
    ...(item.id === agentId
      ? {
          conversations: conversationTitles,
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
            {tab === 'playground' ? (
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

        {tab === 'overview' ? (
          <section className="agent-overview">
            <article className="panel overview-summary">
              <div>
                <p className="eyebrow">Agent overview</p>
                <h2>{agent.description || 'No purpose added yet'}</h2>
                <p>
                  {agent.brain.provider === 'ollama'
                    ? 'Local runtime'
                    : 'Cloud provider configuration'}{' '}
                  · {agent.brain.provider} · {agent.brain.model}
                </p>
              </div>
              <div className="overview-actions">
                <Link
                  className="button button-primary"
                  href={`/agents/${agentId}?tab=playground`}
                >
                  Open Playground
                </Link>
                <Link
                  className="button button-quiet"
                  href={`/agents/${agentId}?tab=settings`}
                >
                  Edit configuration
                </Link>
              </div>
            </article>
            <div className="overview-columns">
              <article className="panel">
                <p className="eyebrow">Behavior</p>
                <h2>Instructions</h2>
                <p className="overview-preview">{agent.instructions}</p>
                <Link
                  className="text-link"
                  href={`/agents/${agentId}?tab=settings`}
                >
                  Edit instructions
                </Link>
              </article>
              <article className="panel">
                <p className="eyebrow">Knowledge</p>
                <h2>
                  {knowledge.length} text source
                  {knowledge.length === 1 ? '' : 's'}
                </h2>
                <p>
                  {agent.generalKnowledge?.trim()
                    ? 'Quick facts are configured.'
                    : 'No quick facts configured.'}
                </p>
                <Link
                  className="text-link"
                  href={`/agents/${agentId}?tab=knowledge`}
                >
                  Manage knowledge
                </Link>
              </article>
              <article className="panel">
                <p className="eyebrow">Testing</p>
                <h2>
                  {evals.length} eval{evals.length === 1 ? '' : 's'}
                </h2>
                <p>Repeatable expected-text checks for this agent.</p>
                <Link
                  className="text-link"
                  href={`/agents/${agentId}?tab=evals`}
                >
                  Open evals
                </Link>
              </article>
            </div>
          </section>
        ) : null}

        {tab === 'playground' ? (
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
                    Create a conversation, then try a question for this agent.
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
                              feedback example
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
                          {message.role === 'assistant' && message.execution ? (
                            <details className="execution-inspector">
                              <summary>Inspect run</summary>
                              <dl>
                                <div>
                                  <dt>Provider</dt>
                                  <dd>{message.execution.provider}</dd>
                                </div>
                                <div>
                                  <dt>Model</dt>
                                  <dd>{message.execution.model}</dd>
                                </div>
                                <div>
                                  <dt>Runtime</dt>
                                  <dd>
                                    {message.execution.durationMs.toLocaleString()}{' '}
                                    ms
                                  </dd>
                                </div>
                                {message.execution.usage?.inputTokens !==
                                undefined ? (
                                  <div>
                                    <dt>Input tokens</dt>
                                    <dd>
                                      {message.execution.usage.inputTokens.toLocaleString()}
                                    </dd>
                                  </div>
                                ) : null}
                                {message.execution.usage?.outputTokens !==
                                undefined ? (
                                  <div>
                                    <dt>Output tokens</dt>
                                    <dd>
                                      {message.execution.usage.outputTokens.toLocaleString()}
                                    </dd>
                                  </div>
                                ) : null}
                                <div>
                                  <dt>Quick facts</dt>
                                  <dd>
                                    {message.execution.usedQuickFacts
                                      ? 'Included'
                                      : 'None'}
                                  </dd>
                                </div>
                                <div className="execution-context">
                                  <dt>Knowledge sources</dt>
                                  <dd>
                                    {message.execution.knowledgeSources.length
                                      ? message.execution.knowledgeSources.map(
                                          (source) => (
                                            <span key={source.id}>
                                              {source.title}
                                            </span>
                                          ),
                                        )
                                      : 'None selected'}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Feedback examples</dt>
                                  <dd>
                                    {message.execution.feedbackExamples.length
                                      ? message.execution.feedbackExamples.map(
                                          (example) => (
                                            <span key={example.id}>
                                              {example.userInput}
                                            </span>
                                          ),
                                        )
                                      : 'None selected'}
                                  </dd>
                                </div>
                              </dl>
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
          <section className="panel agent-settings-stack">
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
              <ModelSelector
                options={providerOptions as ProviderModelOptions}
                initialProvider={agent.brain.provider}
                initialModel={agent.brain.model}
              />
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
            <DeleteAgentControl agentId={agentId} />
          </section>
        ) : null}

        {tab === 'teachings' ? (
          <section className="panel teachings-panel">
            <div>
              <p className="eyebrow">Saved corrections</p>
              <h2>Feedback</h2>
              <p>Relevant corrections are selected for future responses.</p>
            </div>
            {teachings.length === 0 ? (
              <p className="empty-state">
                No feedback saved yet. Use Teach on an assistant response.
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
          <section className="knowledge-layout">
            <div className="panel form-stack">
              <div>
                <p className="eyebrow">Agent sources</p>
                <h2>Knowledge</h2>
                <p>
                  Save reference text for retrieval, or keep links organized
                  with the agent. Linked page content is not fetched yet.
                </p>
              </div>
              {knowledge.length === 0 ? (
                <p className="empty-state">
                  No knowledge sources yet. Add retrievable text or save a link
                  for reference.
                </p>
              ) : (
                knowledge.map((entry) => (
                  <article className="knowledge-entry" key={entry.id}>
                    <div>
                      <strong>{entry.title}</strong>
                      <small>
                        {entry.sourceUrl
                          ? 'Link · saved for reference'
                          : `Text · ${entry.content.length.toLocaleString()} characters`}
                      </small>
                      {entry.sourceUrl ? (
                        <p>
                          <a
                            href={entry.sourceUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {entry.sourceUrl}
                          </a>
                        </p>
                      ) : (
                        <p>{entry.content}</p>
                      )}
                    </div>
                    <form action={deleteKnowledgeAction}>
                      <input type="hidden" name="agentId" value={agentId} />
                      <input
                        type="hidden"
                        name="knowledgeId"
                        value={entry.id}
                      />
                      <button className="text-button" type="submit">
                        Remove
                      </button>
                    </form>
                  </article>
                ))
              )}
              <form
                action={addKnowledgeTextAction}
                className="form-stack knowledge-add-form"
              >
                <input type="hidden" name="agentId" value={agentId} />
                <label>
                  Source title
                  <input
                    name="title"
                    placeholder="Refund policy"
                    required
                    maxLength={120}
                  />
                </label>
                <label>
                  Text
                  <textarea
                    name="content"
                    rows={6}
                    maxLength={20000}
                    required
                    placeholder="Paste the information your agent should reference…"
                  />
                  <small>
                    Up to 20,000 characters. Relevant text is selected for each
                    conversation.
                  </small>
                </label>
                <button type="submit">Add text source</button>
              </form>
              <form
                action={addKnowledgeUrlAction}
                className="form-stack knowledge-add-form"
              >
                <input type="hidden" name="agentId" value={agentId} />
                <label>
                  Add link
                  <input
                    name="url"
                    type="url"
                    placeholder="https://docs.example.com/returns"
                    required
                    maxLength={2000}
                  />
                  <small>
                    Link is saved for reference. Studio does not fetch its page
                    content yet.
                  </small>
                </label>
                <button type="submit">Save link</button>
              </form>
            </div>
            <form
              action={updateGeneralKnowledgeAction}
              className="panel form-stack"
            >
              <div>
                <p className="eyebrow">Quick facts</p>
                <h2>General knowledge</h2>
                <p>Short baseline facts included with every response.</p>
              </div>
              <input type="hidden" name="agentId" value={agentId} />
              <label>
                Facts <span>optional</span>
                <textarea
                  name="generalKnowledge"
                  rows={8}
                  maxLength={10000}
                  defaultValue={agent.generalKnowledge ?? ''}
                  placeholder={
                    'Delivery takes 5–7 business days.\nReturns are accepted within 14 days.'
                  }
                />
                <small>
                  {(agent.generalKnowledge?.length ?? 0).toLocaleString()} /
                  10,000 characters
                </small>
              </label>
              <button type="submit">Save quick facts</button>
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
