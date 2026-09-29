'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import {
  deleteConversationAction,
  renameConversationAction,
  startConversationAction,
} from './actions'

export type StudioNavigationAgent = {
  readonly id: string
  readonly name: string
  readonly provider: string
  readonly model: string
  readonly conversations?: readonly {
    readonly id: string
    readonly label: string
    readonly updatedAt: string
    readonly timestamp: number
  }[]
}

type StudioShellProps = {
  readonly agents: readonly StudioNavigationAgent[]
  readonly activeAgentId?: string
  readonly activeConversationId?: string
  readonly currentSection: string
  readonly landing?: boolean
  readonly children: ReactNode
}

const sectionItems = [
  { id: 'overview', label: 'Overview', icon: 'agents' },
  { id: 'playground', label: 'Chat', icon: 'chat' },
  { id: 'knowledge', label: 'Knowledge', icon: 'knowledge' },
  { id: 'teachings', label: 'Teach', icon: 'teachings' },
  { id: 'evals', label: 'Evals', icon: 'evaluations' },
  { id: 'settings', label: 'Configuration', icon: 'settings' },
] as const

export function AgentSectionNav({
  agentId,
  currentSection,
}: {
  readonly agentId: string
  readonly currentSection: string
}) {
  return (
    <nav aria-label="Agent workspace" className="agent-tabs">
      {sectionItems.map((item) => (
        <Link
          aria-current={currentSection === item.id ? 'page' : undefined}
          className={currentSection === item.id ? 'active' : ''}
          href={`/agents/${agentId}?tab=${item.id}`}
          key={item.id}
        >
          <Icon name={item.icon} /> {item.label}
        </Link>
      ))}
    </nav>
  )
}

export function Icon({ name }: { readonly name: string }) {
  const paths: Record<string, ReactNode> = {
    agents: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    home: (
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" />
    ),
    history: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    chat: (
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-4-.9L4 20l1.3-3.6A7.2 7.2 0 0 1 4 12c0-4.4 3.6-8 8-8s8 3.1 8 7.5Z" />
    ),
    knowledge: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        <path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20" />
      </>
    ),
    teachings: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z" />
        <path d="M8 7h8M8 11h7" />
      </>
    ),
    evaluations: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-5 3 2 5-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a7 7 0 0 1-1.5.9l-.2 1.6h-2.4l-.3-1.6a7 7 0 0 1-1.6-.9l-1.4.6-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.6a7 7 0 0 1 1.6-.9l.3-1.6h2.4l.2 1.6 1.5.9 1.4-.6 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.7Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    send: (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className={`icon icon-${name}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name] ?? paths.agents}
    </svg>
  )
}

export function StudioShell({
  agents,
  activeAgentId,
  activeConversationId,
  currentSection,
  landing = false,
  children,
}: StudioShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedAgent, setExpandedAgent] = useState(activeAgentId ?? '')
  const [conversationQuery, setConversationQuery] = useState('')
  const scopedAgentId = activeAgentId ?? agents[0]?.id

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={`studio-app${landing ? ' is-landing' : ''}`}>
      <header className="forge-titlebar" aria-label="Orvel Studio window">
        <div className="forge-window-brand">
          <span className="forge-brand-mark" aria-hidden="true">
            O
          </span>
          <span>Orvel</span>
        </div>
        <div className="forge-window-controls" aria-hidden="true">
          <span aria-label="Minimize">−</span>
          <span aria-label="Maximize">□</span>
          <span aria-label="Close" className="window-close">
            ×
          </span>
        </div>
      </header>
      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-scrim"
          onClick={closeSidebar}
          type="button"
        />
      ) : null}

      {!landing ? (
        <aside className={`studio-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <header className="sidebar-topline">
            <Link aria-label="Orvel home" className="brand-lockup" href="/">
              <span className="brand-glyph">O</span>
              <span>orvel</span>
            </Link>
            <button
              aria-label="Close navigation"
              className="sidebar-close"
              onClick={closeSidebar}
              type="button"
            >
              ×
            </button>
          </header>

          {scopedAgentId ? (
            <form
              action={startConversationAction}
              className="sidebar-new-chat-form"
            >
              <input name="agentId" type="hidden" value={scopedAgentId} />
              <button className="new-agent-button" type="submit">
                <Icon name="edit" />
                <span>New chat</span>
              </button>
            </form>
          ) : (
            <Link
              className="new-agent-button"
              href="/?view=create"
              onClick={closeSidebar}
            >
              <Icon name="plus" />
              <span>New agent</span>
            </Link>
          )}

          <nav aria-label="Workspace" className="primary-navigation">
            <Link
              aria-current={currentSection === 'agents' ? 'page' : undefined}
              className={currentSection === 'agents' ? 'active' : ''}
              href="/?view=agents"
              onClick={closeSidebar}
            >
              <Icon name="agents" /> Agents
            </Link>
            <Link
              aria-current={currentSection === 'knowledge' ? 'page' : undefined}
              className={currentSection === 'knowledge' ? 'active' : ''}
              href={
                scopedAgentId
                  ? `/agents/${scopedAgentId}?tab=knowledge`
                  : '/?view=agents'
              }
              onClick={closeSidebar}
            >
              <Icon name="knowledge" /> Knowledge
            </Link>
            <Link
              aria-current={currentSection === 'evals' ? 'page' : undefined}
              className={currentSection === 'evals' ? 'active' : ''}
              href={
                scopedAgentId
                  ? `/agents/${scopedAgentId}?tab=evals`
                  : '/?view=agents'
              }
              onClick={closeSidebar}
            >
              <Icon name="evaluations" /> Evals
            </Link>
          </nav>

          <section aria-label="Agents" className="sidebar-agent-section">
            <div className="sidebar-section-heading">
              <span>Your agents</span>
              <Link
                aria-label="Create an agent"
                href="/?view=create"
                onClick={closeSidebar}
              >
                <Icon name="plus" />
              </Link>
            </div>
            <nav aria-label="Your agents" className="sidebar-agent-list">
              {agents.length ? (
                agents.map((agent) => {
                  const selected = activeAgentId === agent.id
                  const expanded = expandedAgent === agent.id
                  return (
                    <div className="sidebar-agent-item" key={agent.id}>
                      <div
                        className={`sidebar-agent-row${selected ? ' selected' : ''}`}
                      >
                        <button
                          aria-expanded={expanded}
                          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${agent.name}`}
                          className="sidebar-agent-expander"
                          onClick={() =>
                            setExpandedAgent(expanded ? '' : agent.id)
                          }
                          type="button"
                        >
                          <Icon name="chevron" />
                        </button>
                        <Link
                          className="sidebar-agent-link"
                          href={`/agents/${agent.id}?tab=playground`}
                          onClick={closeSidebar}
                        >
                          <span className="agent-avatar">
                            {agent.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="sidebar-agent-name">
                            {agent.name}
                          </span>
                        </Link>
                      </div>
                      {expanded ? (
                        <div className="sidebar-agent-tools">
                          {sectionItems.map((item) => (
                            <Link
                              aria-current={
                                selected && currentSection === item.id
                                  ? 'page'
                                  : undefined
                              }
                              className={
                                selected && currentSection === item.id
                                  ? 'active'
                                  : ''
                              }
                              href={`/agents/${agent.id}?tab=${item.id}`}
                              key={item.id}
                              onClick={closeSidebar}
                            >
                              <Icon name={item.icon} /> {item.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <p className="sidebar-empty">Your agents will appear here.</p>
              )}
            </nav>
          </section>

          <details
            className="sidebar-recents"
            open={Boolean(activeConversationId) || undefined}
          >
            <summary>
              <Icon name="history" />
              <span>Recent chats</span>
              <Icon name="chevron" />
            </summary>
            <label className="recent-search">
              <span className="visually-hidden">Search conversations</span>
              <Icon name="history" />
              <input
                onChange={(event) =>
                  setConversationQuery(event.target.value.trim().toLowerCase())
                }
                placeholder="Search chats"
                type="search"
                value={conversationQuery}
              />
            </label>
            <nav aria-label="Recent conversations" className="recent-chat-list">
              {agents
                .flatMap((agent) =>
                  (agent.conversations ?? []).map((conversation) => ({
                    ...conversation,
                    agentId: agent.id,
                    agentName: agent.name,
                  })),
                )
                .sort((left, right) => right.timestamp - left.timestamp)
                .filter((conversation) =>
                  `${conversation.label} ${conversation.agentName}`
                    .toLowerCase()
                    .includes(conversationQuery),
                )
                .map((conversation) => (
                  <div className="recent-chat-row" key={conversation.id}>
                    <Link
                      aria-current={
                        activeConversationId === conversation.id
                          ? 'page'
                          : undefined
                      }
                      className={`recent-chat-link${activeConversationId === conversation.id ? ' selected' : ''}`}
                      href={`/agents/${conversation.agentId}?tab=playground&conversation=${conversation.id}`}
                      onClick={closeSidebar}
                    >
                      <span className="recent-chat-title">
                        {conversation.label}
                      </span>
                      <small>
                        {conversation.agentName} · {conversation.updatedAt}
                      </small>
                    </Link>
                    <details className="conversation-actions">
                      <summary
                        aria-label="Conversation actions"
                        title="Conversation actions"
                      >
                        ···
                      </summary>
                      <div>
                        <form action={renameConversationAction}>
                          <input
                            name="agentId"
                            type="hidden"
                            value={conversation.agentId}
                          />
                          <input
                            name="conversationId"
                            type="hidden"
                            value={conversation.id}
                          />
                          <label>
                            Rename
                            <input
                              name="title"
                              maxLength={120}
                              required
                              defaultValue={conversation.label}
                            />
                          </label>
                          <button type="submit">Save name</button>
                        </form>
                        <form
                          action={deleteConversationAction}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                'Delete this conversation and its messages? This cannot be undone.',
                              )
                            ) {
                              event.preventDefault()
                            }
                          }}
                        >
                          <input
                            name="agentId"
                            type="hidden"
                            value={conversation.agentId}
                          />
                          <input
                            name="conversationId"
                            type="hidden"
                            value={conversation.id}
                          />
                          <button type="submit">Delete chat</button>
                        </form>
                      </div>
                    </details>
                  </div>
                ))}
              {agents.some((agent) => agent.conversations?.length) &&
              !agents.some((agent) =>
                (agent.conversations ?? []).some((conversation) =>
                  `${conversation.label} ${agent.name}`
                    .toLowerCase()
                    .includes(conversationQuery),
                ),
              ) ? (
                <p className="conversation-no-results">No matching chats</p>
              ) : null}
              {!agents.some((agent) => agent.conversations?.length) ? (
                <p className="recent-empty">Conversations appear here.</p>
              ) : null}
            </nav>
          </details>

          <footer className="sidebar-footer">
            <Link
              aria-current={
                currentSection === 'settings' && !activeAgentId
                  ? 'page'
                  : undefined
              }
              className={
                currentSection === 'settings' && !activeAgentId ? 'active' : ''
              }
              href="/?view=settings"
              onClick={closeSidebar}
            >
              <Icon name="settings" /> Settings
            </Link>
            <span>Local workspace</span>
          </footer>
        </aside>
      ) : null}

      <div className="forge-workspace">
        {children}
        {!landing && scopedAgentId ? (
          <nav aria-label="Agent tools" className="forge-tool-rail">
            {sectionItems.map((item) => (
              <Link
                aria-current={
                  currentSection === item.id && activeAgentId
                    ? 'page'
                    : undefined
                }
                className={currentSection === item.id ? 'active' : ''}
                href={`/agents/${scopedAgentId}?tab=${item.id}`}
                key={item.id}
                title={item.label}
              >
                <Icon name={item.icon} />
                <span className="visually-hidden">{item.label}</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {!landing ? (
        <button
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen((open) => !open)}
          type="button"
        >
          <Icon name="agents" />
        </button>
      ) : null}
    </div>
  )
}
