import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

import {
  DashboardSquare01Icon,
  Home01Icon,
  PlusSignIcon,
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
          <Image
            alt="Orvel"
            className="brand-mark"
            height={28}
            priority
            src="/orvel-mark.png"
            width={28}
          />
          <span>Orvel</span>
        </Link>
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
        </nav>
        <div className="sidebar-section-heading">
          <span>Your agents</span>
          <Link aria-label="Create agent" href="/agents/new">
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
      </aside>
      <div className="app-content">{children}</div>
    </div>
  )
}
