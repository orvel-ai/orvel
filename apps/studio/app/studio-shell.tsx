'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

export type StudioNavigationAgent = {
  readonly id: string
  readonly name: string
  readonly provider: string
  readonly model: string
  readonly conversations?: readonly {
    readonly id: string
    readonly label: string
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
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'knowledge', label: 'Knowledge', icon: 'knowledge' },
  { id: 'teachings', label: 'Teachings', icon: 'teachings' },
  { id: 'evals', label: 'Evaluations', icon: 'evaluations' },
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
        <div className="explorer-heading">
          <span>Explorer</span>
          <button
            aria-label="Close Explorer"
            className="icon-button mobile-close"
            onClick={() => setExplorerOpen(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="explorer-group-heading">
          <span>Agents</span>
          <Link
            aria-label="Create an agent"
            className="icon-button"
            href="/?view=create"
            title="Create an agent"
          >
            <Icon name="plus" />
          </Link>
        </div>
        <label className="agent-filter">
          <span className="visually-hidden">Filter agents</span>
          <input
            onChange={(event) => {
              const query = event.currentTarget.value.trim().toLowerCase()
              document
                .querySelectorAll<HTMLElement>('[data-agent-name]')
                .forEach((row) => {
                  row.hidden = !row.dataset.agentName?.includes(query)
                })
            }}
            placeholder="Filter agents"
          />
        </label>
        <nav aria-label="Agent Explorer" className="agent-tree">
          {agents.length === 0 ? (
            <p className="tree-empty">No agents yet. Create one to begin.</p>
          ) : (
            agents.map((agent) => {
              const expanded = expandedAgent === agent.id
              const selected = activeAgentId === agent.id
              const conversations = agent.conversations ?? []

              return (
                <div
                  className="tree-agent"
                  data-agent-name={agent.name.toLowerCase()}
                  key={agent.id}
                >
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
                      onClick={() => setExplorerOpen(false)}
                    >
                      <span
                        className={`agent-avatar ${agent.id === 'research' ? 'avatar-dark' : agent.id === 'marketing' ? 'avatar-violet' : ''}`}
                      >
                        {agent.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="tree-agent-name">{agent.name}</span>
                    </Link>
                  </div>
                  {expanded ? (
                    <div className="tree-sections">
                      {sectionItems.map((item) => (
                        <div key={item.id}>
                          <Link
                            aria-current={
                              selected && currentSection === item.id
                                ? 'page'
                                : undefined
                            }
                            className={`tree-section-link${selected && currentSection === item.id ? ' selected' : ''}`}
                            href={`/agents/${agent.id}${item.id === 'chat' ? '' : `?tab=${item.id}`}`}
                            onClick={() => setExplorerOpen(false)}
                          >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                            {item.id === 'chat' && conversations.length ? (
                              <small>{conversations.length}</small>
                            ) : null}
                          </Link>
                          {item.id === 'chat' &&
                          selected &&
                          currentSection === 'chat' &&
                          conversations.length ? (
                            <div className="tree-conversations">
                              {conversations.map((conversation, index) => (
                                <Link
                                  aria-current={
                                    activeConversationId === conversation.id
                                      ? 'page'
                                      : undefined
                                  }
                                  className={`tree-conversation-link${activeConversationId === conversation.id ? ' selected' : ''}`}
                                  href={`/agents/${agent.id}?conversation=${conversation.id}`}
                                  key={conversation.id}
                                  onClick={() => setExplorerOpen(false)}
                                >
                                  <span className="conversation-branch" />
                                  <Icon name="chat" />
                                  <span>
                                    Conversation {conversations.length - index}
                                  </span>
                                  <small>{conversation.label}</small>
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </nav>
      </aside>

      {children}

      <nav aria-label="Studio navigation" className="floating-dock">
        <Link
          aria-label="Browse agents"
          className={`dock-button dock-desktop${currentSection === 'welcome' || currentSection === 'agents' || currentSection === 'create' ? ' active' : ''}`}
          href="/?view=agents"
          title="Agents"
        >
          <Icon name="agents" />
        </Link>
        <button
          aria-expanded={explorerOpen}
          aria-label="Agents and Explorer"
          className={`dock-button dock-mobile${currentSection === 'welcome' || currentSection === 'agents' || currentSection === 'create' ? ' active' : ''}`}
          onClick={() => setExplorerOpen((open) => !open)}
          title="Agents"
          type="button"
        >
          <Icon name="agents" />
        </button>
        <Link
          aria-label="Studio settings"
          className={`dock-button${currentSection === 'settings' ? ' active' : ''}`}
          href="/?view=settings"
          title="Settings"
        >
          <Icon name="settings" />
        </Link>
        <details className="dock-profile">
          <summary aria-label="Profile" className="dock-button" title="Profile">
            <Icon name="person" />
          </summary>
          <div className="profile-popover">
            <strong>Orvel Studio</strong>
            <span>Local workspace</span>
            <Link href="/">Back to workspace</Link>
          </div>
        </details>
      </nav>
    </div>
  )
}
