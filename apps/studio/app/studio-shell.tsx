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
  readonly children: ReactNode
}

const sectionItems = [
  { id: 'overview', label: 'Overview', icon: 'agents' },
  { id: 'playground', label: 'Playground', icon: 'chat' },
  { id: 'knowledge', label: 'Knowledge', icon: 'knowledge' },
  { id: 'teachings', label: 'Feedback', icon: 'teachings' },
  { id: 'evals', label: 'Evals', icon: 'evaluations' },
  { id: 'settings', label: 'Configuration', icon: 'settings' },
] as const

export function Icon({ name }: { readonly name: string }) {
  const paths: Record<string, ReactNode> = {
    agents: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    chat: (
      <>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-4-.9L4 20l1.3-3.6A7.2 7.2 0 0 1 4 12c0-4.4 3.6-8 8-8s8 3.1 8 7.5Z" />
      </>
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
    evals: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-5 3 2 5-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a7 7 0 0 1-1.5.9l-.2 1.6h-2.4l-.3-1.6a7 7 0 0 1-1.6-.9l-1.4.6-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.6a7 7 0 0 1 1.6-.9l.3-1.6h2.4l.2 1.6a7 7 0 0 1 1.5.9l1.4-.6 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.7Z" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.7-3.6 3.2-5.5 7-5.5s6.3 1.9 7 5.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h11" />
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
  children,
}: StudioShellProps) {
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [expandedAgent, setExpandedAgent] = useState(activeAgentId ?? '')
  const [conversationQuery, setConversationQuery] = useState('')

  return (
    <div className="studio-app">
      {explorerOpen ? (
        <button
          aria-label="Close Explorer"
          className="explorer-scrim"
          onClick={() => setExplorerOpen(false)}
          type="button"
        />
      ) : null}

      <aside className={`studio-explorer${explorerOpen ? ' is-open' : ''}`}>
        <header className="chat-sidebar-brand">
          <Link aria-label="Orvel home" className="brand-mark" href="/">
            <Icon name="agents" />
          </Link>
          <span>Orvel</span>
          <button
            aria-label="Close sidebar"
            className="icon-button mobile-close"
            onClick={() => setExplorerOpen(false)}
            type="button"
          >
            ×
          </button>
        </header>

        {activeAgentId && agents.some((agent) => agent.id === activeAgentId) ? (
          <form action={startConversationAction} className="new-chat-form">
            <input name="agentId" type="hidden" value={activeAgentId} />
            <button className="new-chat-button" type="submit">
              <Icon name="plus" /> New chat
            </button>
          </form>
        ) : agents[0] ? (
          <form action={startConversationAction} className="new-chat-form">
            <input name="agentId" type="hidden" value={agents[0].id} />
            <button className="new-chat-button" type="submit">
              <Icon name="plus" /> New chat
            </button>
          </form>
        ) : (
          <Link className="new-chat-button" href="/?view=create">
            <Icon name="plus" /> Create an agent
          </Link>
        )}

        <Link className="sidebar-agents-link" href="/?view=agents">
          <Icon name="agents" /> <span>Agents</span>
          <Icon name="chevron" />
        </Link>
        <label className="recent-search">
          <span className="visually-hidden">Search conversations</span>
          <Icon name="search" />
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
          <p className="sidebar-section-label">Recents</p>
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
                  onClick={() => setExplorerOpen(false)}
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
                        )
                          event.preventDefault()
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
            <p className="recent-empty">Your conversations will appear here.</p>
          ) : null}
        </nav>

        <details className="sidebar-agent-manager">
          <summary>Agent workspace</summary>
          <nav aria-label="Agent workspace" className="agent-tree">
            {agents.map((agent) => {
              const expanded = expandedAgent === agent.id
              const selected = activeAgentId === agent.id
              return (
                <div className="tree-agent" key={agent.id}>
                  <div
                    className={`tree-agent-row${selected ? ' selected' : ''}`}
                  >
                    <button
                      aria-expanded={expanded}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${agent.name}`}
                      className="tree-chevron"
                      onClick={() => setExpandedAgent(expanded ? '' : agent.id)}
                      type="button"
                    >
                      <Icon name="chevron" />
                    </button>
                    <Link
                      className="tree-agent-link"
                      href={`/agents/${agent.id}`}
                    >
                      <span className="agent-avatar">
                        {agent.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="tree-agent-name">{agent.name}</span>
                    </Link>
                  </div>
                  {expanded ? (
                    <div className="tree-sections">
                      {sectionItems.map((item) => (
                        <Link
                          aria-current={
                            selected && currentSection === item.id
                              ? 'page'
                              : undefined
                          }
                          className={`tree-section-link${selected && currentSection === item.id ? ' selected' : ''}`}
                          href={`/agents/${agent.id}${item.id === 'overview' ? '' : `?tab=${item.id}`}`}
                          key={item.id}
                        >
                          <Icon name={item.icon} /> <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>
          <Link className="sidebar-create-agent" href="/?view=create">
            <Icon name="plus" /> Create an agent
          </Link>
        </details>

        <footer className="sidebar-footer">
          <Link href="/?view=settings">
            <Icon name="settings" /> Settings
          </Link>
          <details className="dock-profile">
            <summary>
              <Icon name="person" />
              <span>Orvel Studio</span>
            </summary>
            <div className="profile-popover">
              <strong>Orvel Studio</strong>
              <span>Local workspace</span>
              <Link href="/">Back to workspace</Link>
            </div>
          </details>
        </footer>
      </aside>

      {children}
      <button
        aria-expanded={explorerOpen}
        aria-label="Toggle sidebar"
        className="mobile-sidebar-toggle"
        onClick={() => setExplorerOpen((open) => !open)}
        type="button"
      >
        <Icon name="agents" />
      </button>
    </div>
  )
}
