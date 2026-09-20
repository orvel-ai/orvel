import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  AiSparklesIcon,
  DashboardSquare01Icon,
  FolderLibraryIcon,
  Home01Icon,
  Message01Icon,
  PlusSignIcon,
  Search01Icon,
  Settings01Icon,
  TestTube01Icon,
} from '@hugeicons/core-free-icons'
import type { AgentDefinition } from '@orvel/sdk'

import { Avatar, Icon } from './ui'

type StudioShellProps = {
  readonly agents: readonly AgentDefinition[]
  readonly selectedAgentId?: string
  readonly currentSection?: 'home' | 'agents'
  readonly children: ReactNode
}

export function StudioShell({
  agents,
  selectedAgentId,
  currentSection,
  children,
}: StudioShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Orvel Studio navigation">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <span />
          </span>
          <span>Orvel</span>
        </Link>
        <label className="command-field">
          <Icon icon={Search01Icon} size={16} />
          <input aria-label="Search Studio" placeholder="Search…" readOnly />
          <kbd>⌘ K</kbd>
        </label>
        <nav className="sidebar-nav">
          <Link
            className={`sidebar-item ${currentSection === 'home' ? 'active' : ''}`}
            href="/"
          >
            <Icon icon={Home01Icon} />
            Home
          </Link>
          <Link
            className={`sidebar-item ${currentSection === 'agents' ? 'active' : ''}`}
            href="/agents"
          >
            <Icon icon={DashboardSquare01Icon} />
            Agents
          </Link>
          <span className="sidebar-item muted" title="Coming soon">
            <Icon icon={Message01Icon} />
            Playground
          </span>
          <span
            className="sidebar-item muted"
            title="Use an agent workspace to run evaluations"
          >
            <Icon icon={TestTube01Icon} />
            Evaluations
          </span>
          <span className="sidebar-item muted" title="Coming soon">
            <Icon icon={FolderLibraryIcon} />
            Library
          </span>
          <span className="sidebar-item muted" title="Coming soon">
            <Icon icon={Settings01Icon} />
            Settings
          </span>
        </nav>
        <div className="sidebar-section-heading">
          <span>Your agents</span>
          <Link aria-label="Create agent" href="/#new-agent">
            <Icon icon={PlusSignIcon} size={16} />
          </Link>
        </div>
        <div className="sidebar-agents">
          {agents.length === 0 ? (
            <p className="sidebar-empty">
              Create your first agent to get started.
            </p>
          ) : null}
          {agents.map((agent) => (
            <Link
              className={`agent-row ${agent.id === selectedAgentId ? 'selected' : ''}`}
              href={`/agents/${agent.id}`}
              key={agent.id}
            >
              <Avatar compact name={agent.name} />
              <span>
                <strong>{agent.name}</strong>
                <small>{agent.description ?? agent.instructions}</small>
              </span>
              {agent.id === selectedAgentId ? (
                <i aria-label="Active agent" />
              ) : null}
            </Link>
          ))}
        </div>
        <div className="profile-row">
          <Avatar compact name="Mahmud" />
          <span>
            <strong>Mahmud</strong>
            <small>Personal workspace</small>
          </span>
          <Icon icon={AiSparklesIcon} size={16} />
        </div>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  )
}
