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
    folder: (
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
    ),
    desktop: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    terminal: (
      <>
        <path d="m4 7 5 5-5 5m8 1h8" />
        <rect x="2.5" y="3" width="19" height="18" rx="3" />
      </>
    ),
    graph: (
      <>
        <rect x="3" y="4" width="7" height="6" rx="1.5" />
        <rect x="14" y="14" width="7" height="6" rx="1.5" />
        <path d="M10 7h3a2 2 0 0 1 2 2v5" />
      </>
    ),
    browser: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
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
  const [workspacePanel, setWorkspacePanel] = useState<
    'terminal' | 'graph' | 'browser' | null
  >(null)
  const scopedAgentId = activeAgentId ?? agents[0]?.id

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={`studio-app${landing ? ' is-landing' : ''}`}>
      <header className="forge-titlebar" aria-label="Forge window">
        <div className="forge-window-brand">
          <span className="forge-brand-mark" aria-hidden="true">
            F
          </span>
          <span>Forge</span>
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
            <Link aria-label="Forge home" className="brand-lockup" href="/">
              <span className="brand-glyph">F</span>
              <span>Forge</span>
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
                <span>New Chat</span>
              </button>
            </form>
          ) : (
            <Link
              className="new-agent-button"
              href="/?view=create"
              onClick={closeSidebar}
            >
              <Icon name="edit" />
              <span>New Chat</span>
            </Link>
          )}

          <nav aria-label="Main menu" className="primary-navigation">
            <Link href="/?view=settings" onClick={closeSidebar}>
              <Icon name="knowledge" /> Integrations
            </Link>
            <Link href="/?view=settings" onClick={closeSidebar}>
              <Icon name="settings" /> Account Management
            </Link>
          </nav>

          <section
            aria-label="Projects"
            className="sidebar-agent-section forge-projects-list"
          >
            <div className="sidebar-section-heading">
              <span>Projects</span>
              <Link
                aria-label="Create a project"
                href="/?view=create"
                onClick={closeSidebar}
              >
                <Icon name="plus" />
              </Link>
            </div>
            <nav aria-label="Projects" className="sidebar-agent-list">
              {agents.map((agent) => (
                <Link
                  aria-current={activeAgentId === agent.id ? 'page' : undefined}
                  className={`forge-project-link${activeAgentId === agent.id ? ' selected' : ''}`}
                  href={`/agents/${agent.id}?tab=playground`}
                  key={agent.id}
                  onClick={closeSidebar}
                >
                  <Icon name="knowledge" />
                  <span>{agent.name}</span>
                </Link>
              ))}
            </nav>
          </section>

          <section
            aria-label="Drafts"
            className="sidebar-recents forge-drafts-list"
          >
            <div className="sidebar-section-heading">
              <span>Drafts</span>
            </div>
            <nav aria-label="Drafts" className="recent-chat-list">
              {agents
                .flatMap((agent) =>
                  (agent.conversations ?? []).map((conversation) => ({
                    ...conversation,
                    agentId: agent.id,
                  })),
                )
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 12)
                .map((conversation) => (
                  <Link
                    aria-current={
                      activeConversationId === conversation.id
                        ? 'page'
                        : undefined
                    }
                    className={`recent-chat-link${activeConversationId === conversation.id ? ' selected' : ''}`}
                    href={`/agents/${conversation.agentId}?tab=playground&conversation=${conversation.id}`}
                    key={conversation.id}
                    onClick={closeSidebar}
                  >
                    <Icon name="edit" />
                    <span className="recent-chat-title">
                      {conversation.label}
                    </span>
                  </Link>
                ))}
              {!agents.some((agent) => agent.conversations?.length) ? (
                <p className="recent-empty">No drafts yet</p>
              ) : null}
            </nav>
          </section>

          <footer className="sidebar-footer">
            <Link href="/?view=settings" onClick={closeSidebar}>
              <Icon name="settings" /> Settings
            </Link>
            <Link
              className="forge-upgrade"
              href="/?view=settings"
              onClick={closeSidebar}
            >
              Upgrade
            </Link>
          </footer>
        </aside>
      ) : null}

      <div
        className={`forge-workspace${workspacePanel ? ' has-preview-panel' : ''}`}
      >
        {children}
        {workspacePanel ? (
          <section
            aria-label={`${workspacePanel} workspace panel`}
            className="forge-preview-panel"
          >
            <header className="forge-preview-tabs">
              <button
                className={workspacePanel === 'terminal' ? 'active' : ''}
                onClick={() => setWorkspacePanel('terminal')}
                type="button"
              >
                <Icon name="terminal" /> Terminal
              </button>
              <button
                className={workspacePanel === 'graph' ? 'active' : ''}
                onClick={() => setWorkspacePanel('graph')}
                type="button"
              >
                <Icon name="graph" /> Node Graph
              </button>
              <button
                aria-label="Close workspace panel"
                className="forge-preview-close"
                onClick={() => setWorkspacePanel(null)}
                type="button"
              >
                ×
              </button>
            </header>
            {workspacePanel === 'graph' ? <ForgeNodeGraph /> : null}
            {workspacePanel === 'terminal' ? <ForgeTerminal /> : null}
            {workspacePanel === 'browser' ? <ForgeBrowser /> : null}
          </section>
        ) : null}
        {!landing && scopedAgentId ? (
          <nav aria-label="Workspace tools" className="forge-tool-rail">
            <button
              aria-label="Open terminal panel"
              className={workspacePanel === 'terminal' ? 'active' : ''}
              onClick={() =>
                setWorkspacePanel(
                  workspacePanel === 'terminal' ? null : 'terminal',
                )
              }
              title="Terminal"
              type="button"
            >
              <Icon name="terminal" />
            </button>
            <button
              aria-label="Open node graph panel"
              className={workspacePanel === 'graph' ? 'active' : ''}
              onClick={() =>
                setWorkspacePanel(workspacePanel === 'graph' ? null : 'graph')
              }
              title="Node Graph"
              type="button"
            >
              <Icon name="graph" />
            </button>
            <button
              aria-label="Open browser panel"
              className={workspacePanel === 'browser' ? 'active' : ''}
              onClick={() =>
                setWorkspacePanel(
                  workspacePanel === 'browser' ? null : 'browser',
                )
              }
              title="Browser"
              type="button"
            >
              <Icon name="browser" />
            </button>
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

function ForgeNodeGraph() {
  return (
    <div className="forge-graph-canvas">
      <svg
        aria-hidden="true"
        className="forge-graph-connections"
        viewBox="0 0 700 500"
        preserveAspectRatio="none"
      >
        <path d="M190 220 C255 220 245 160 310 160 M190 240 C255 240 245 285 310 285 M440 160 C490 160 480 220 535 220 M440 285 C490 285 480 230 535 230" />
      </svg>
      <article className="forge-node forge-node-main">
        <small>◈ Agent</small>
        <strong>Project assistant</strong>
        <span>Instructions and user input</span>
      </article>
      <article className="forge-node forge-node-context">
        <small>◉ Context</small>
        <strong>Conversation</strong>
        <span>Current messages</span>
      </article>
      <article className="forge-node forge-node-knowledge">
        <small>▤ Knowledge</small>
        <strong>Project sources</strong>
        <span>Reference material</span>
      </article>
      <article className="forge-node forge-node-output">
        <small>↗ Output</small>
        <strong>Assistant response</strong>
        <span>Ready for review</span>
      </article>
    </div>
  )
}

function ForgeTerminal() {
  return (
    <div className="forge-terminal-view">
      <div className="forge-terminal-welcome">
        <span className="forge-terminal-symbol">F</span>
        <strong>Forge Terminal</strong>
        <small>Workspace console</small>
      </div>
      <p>
        <span>›</span> Ready for your next command
      </p>
      <div className="forge-terminal-prompt">
        <span>›</span>
        <i />
      </div>
    </div>
  )
}

function ForgeBrowser() {
  return (
    <div className="forge-browser-view">
      <div className="forge-browser-address">
        <span>‹</span>
        <span>›</span>
        <span>↻</span>
        <div>Search or enter address</div>
        <Icon name="plus" />
      </div>
      <div className="forge-browser-empty">
        <span>◉</span>
        <strong>New tab</strong>
        <small>Enter an address to browse</small>
      </div>
    </div>
  )
}
