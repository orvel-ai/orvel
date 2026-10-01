'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { startConversationAction } from './actions'

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
  { id: 'playground', label: 'Chat', icon: 'chat' },
  { id: 'knowledge', label: 'Knowledge', icon: 'knowledge' },
  { id: 'teachings', label: 'Feedback', icon: 'teachings' },
  { id: 'evals', label: 'Evaluations', icon: 'evaluations' },
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
        <path d="m16.5 3.5 4 4L8 20l-5 1 1-5L16.5 3.5Z" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [expandedAgents, setExpandedAgents] = useState<string[]>(
    activeAgentId ? [activeAgentId] : [],
  )
  const scopedAgentId = activeAgentId ?? agents[0]?.id
  const normalizedFilter = filter.trim().toLocaleLowerCase()
  const visibleAgents = agents.filter((agent) =>
    `${agent.name} ${agent.conversations?.map((item) => item.label).join(' ') ?? ''}`
      .toLocaleLowerCase()
      .includes(normalizedFilter),
  )
  const closeSidebar = () => setSidebarOpen(false)
  const toggleAgent = (agentId: string) =>
    setExpandedAgents((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId],
    )

  return (
    <div className="studio-app">
      {sidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-scrim"
          onClick={closeSidebar}
          type="button"
        />
      ) : null}
      <aside className={`studio-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <header className="sidebar-topline">
          <Link aria-label="Orvel home" className="brand-lockup" href="/">
            <span className="brand-glyph" aria-hidden="true">
              O
            </span>
            <span>Orvel</span>
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
              <span>New conversation</span>
            </button>
          </form>
        ) : (
          <Link
            className="new-agent-button"
            href="/?view=create"
            onClick={closeSidebar}
          >
            <Icon name="plus" />
            <span>Create an agent</span>
          </Link>
        )}

        <section aria-label="Agents" className="sidebar-agent-section">
          <div className="sidebar-section-heading">
            <span>Agents</span>
            <Link
              aria-label="Create agent"
              href="/?view=create"
              onClick={closeSidebar}
            >
              <Icon name="plus" />
            </Link>
          </div>
          <label className="sidebar-search">
            <Icon name="search" />
            <span className="visually-hidden">
              Filter agents and conversations
            </span>
            <input
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter agents"
              value={filter}
            />
          </label>
          <nav aria-label="Agent list" className="sidebar-agent-list">
            {visibleAgents.map((agent) => {
              const expanded = expandedAgents.includes(agent.id)
              return (
                <div className="sidebar-agent-item" key={agent.id}>
                  <div
                    className={`sidebar-agent-row${activeAgentId === agent.id ? ' selected' : ''}`}
                  >
                    <button
                      aria-expanded={expanded}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${agent.name}`}
                      className="sidebar-agent-expander"
                      onClick={() => toggleAgent(agent.id)}
                      type="button"
                    >
                      <Icon name="chevron" />
                    </button>
                    <Link
                      aria-current={
                        activeAgentId === agent.id ? 'page' : undefined
                      }
                      className="sidebar-agent-link"
                      href={`/agents/${agent.id}?tab=overview`}
                      onClick={closeSidebar}
                    >
                      <span className="agent-avatar">
                        {agent.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="sidebar-agent-name">{agent.name}</span>
                    </Link>
                  </div>
                  {expanded ? (
                    <div className="sidebar-agent-children">
                      <Link
                        className="sidebar-agent-workspace"
                        href={`/agents/${agent.id}?tab=playground`}
                        onClick={closeSidebar}
                      >
                        <Icon name="chat" />
                        New chat
                      </Link>
                      {(agent.conversations ?? [])
                        .filter(
                          (item) =>
                            !normalizedFilter ||
                            item.label
                              .toLocaleLowerCase()
                              .includes(normalizedFilter),
                        )
                        .slice(0, 8)
                        .map((conversation) => (
                          <Link
                            aria-current={
                              activeConversationId === conversation.id
                                ? 'page'
                                : undefined
                            }
                            className={`recent-chat-link${activeConversationId === conversation.id ? ' selected' : ''}`}
                            href={`/agents/${agent.id}?tab=playground&conversation=${conversation.id}`}
                            key={conversation.id}
                            onClick={closeSidebar}
                          >
                            <span className="recent-chat-title">
                              {conversation.label}
                            </span>
                            <small>{conversation.updatedAt}</small>
                          </Link>
                        ))}
                      {!agent.conversations?.length ? (
                        <p className="recent-empty">No conversations yet</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
            {!visibleAgents.length ? (
              <p className="recent-empty">
                {agents.length ? 'No matching agents' : 'No agents yet'}
              </p>
            ) : null}
          </nav>
        </section>

        <footer className="sidebar-footer">
          <Link
            aria-current={currentSection === 'settings' ? 'page' : undefined}
            href="/?view=settings"
            onClick={closeSidebar}
          >
            <Icon name="settings" />
            Workspace settings
          </Link>
        </footer>
      </aside>

      <div className="studio-workspace">{children}</div>

      <button
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen((open) => !open)}
        type="button"
      >
        <Icon name="agents" />
      </button>
    </div>
  )
}
