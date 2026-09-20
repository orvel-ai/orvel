import Image from 'next/image'
import Link from 'next/link'

import {
  AiSparklesIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Message01Icon,
  Rocket01Icon,
  TestTube01Icon,
} from '@hugeicons/core-free-icons'

import { Icon } from './components/ui'

const featuredAgents = [
  {
    name: 'Customer Support Guide',
    description:
      'A thoughtful first responder for product questions and common requests.',
    category: 'Support',
    color: 'blue',
    icon: Message01Icon,
  },
  {
    name: 'Study Companion',
    description:
      'Break down unfamiliar topics, make a plan, and keep learning moving.',
    category: 'Education',
    color: 'green',
    icon: BookOpen01Icon,
  },
  {
    name: 'Product Researcher',
    description:
      'Turn rough ideas into structured questions, summaries, and next steps.',
    category: 'Product',
    color: 'orange',
    icon: AiSparklesIcon,
  },
] as const

export default function Home() {
  return (
    <main className="public-home">
      <header className="public-nav">
        <Link className="public-brand" href="/">
          <Image
            alt="Orvel"
            className="public-brand-mark"
            height={36}
            priority
            src="/orvel-mark.png"
            width={36}
          />
          <span>Orvel</span>
        </Link>
        <nav aria-label="Public navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#featured-agents">Agent examples</a>
        </nav>
        <Link className="public-nav-cta" href="/agents">
          Open Studio <Icon icon={ArrowRight01Icon} size={15} />
        </Link>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-eyebrow">
            <span /> AI agents that learn with you
          </p>
          <h1>Build an agent people can count on.</h1>
          <p className="public-hero-description">
            Orvel helps you turn your expertise into helpful AI agents. Give
            them clear instructions, useful knowledge, and corrections that make
            every conversation better.
          </p>
          <div className="public-hero-actions">
            <Link className="public-primary-button" href="/agents#new-agent">
              Create an agent <Icon icon={ArrowRight01Icon} size={17} />
            </Link>
            <a className="public-text-button" href="#featured-agents">
              See agent examples
            </a>
          </div>
          <div className="public-trust-row">
            <span>
              <Icon icon={CheckmarkCircle02Icon} size={16} /> Bring your own
              model
            </span>
            <span>
              <Icon icon={CheckmarkCircle02Icon} size={16} /> Start locally
            </span>
          </div>
        </div>
        <div aria-hidden="true" className="public-hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <Image
            alt=""
            className="hero-mark"
            height={440}
            src="/orvel-mark.png"
            width={440}
          />
          <div className="hero-message-card hero-message-top">
            <span className="mini-avatar blue">A</span>
            <p>Can you help me get started?</p>
          </div>
          <div className="hero-message-card hero-message-bottom">
            <span className="mini-avatar green">O</span>
            <p>Absolutely. Here’s a clear first step.</p>
          </div>
        </div>
      </section>

      <section className="public-feature-strip">
        <p>Make AI agents more useful, one correction at a time.</p>
        <div>
          <span>Instructions</span>
          <i />
          <span>Knowledge</span>
          <i />
          <span>Teachings</span>
        </div>
      </section>

      <section className="public-section" id="how-it-works">
        <div className="public-section-heading">
          <p className="public-eyebrow">Simple by design</p>
          <h2>From your expertise to a better conversation.</h2>
        </div>
        <div className="public-steps">
          <article>
            <span>01</span>
            <Icon icon={Rocket01Icon} size={22} />
            <h3>Set the foundation</h3>
            <p>
              Define how your agent should behave and the facts it needs from
              day one.
            </p>
          </article>
          <article>
            <span>02</span>
            <Icon icon={Message01Icon} size={22} />
            <h3>Use it in real life</h3>
            <p>
              Start conversations and see exactly how your agent responds to
              real questions.
            </p>
          </article>
          <article>
            <span>03</span>
            <Icon icon={TestTube01Icon} size={22} />
            <h3>Make it sharper</h3>
            <p>
              Save corrections as teachings, then evaluate the behavior you care
              about.
            </p>
          </article>
        </div>
      </section>

      <section
        className="public-section public-agent-section"
        id="featured-agents"
      >
        <div className="public-section-heading with-link">
          <div>
            <p className="public-eyebrow">Agent examples</p>
            <h2>Start with a familiar role.</h2>
          </div>
          <span>Public discovery is coming soon</span>
        </div>
        <div className="public-agent-grid">
          {featuredAgents.map((agent) => (
            <article
              className={`public-agent-card ${agent.color}`}
              key={agent.name}
            >
              <div className="public-agent-card-top">
                <span className="public-agent-icon">
                  <Icon icon={agent.icon} size={20} />
                </span>
                <small>{agent.category}</small>
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.description}</p>
              <Link href="/agents#new-agent">
                Use this as inspiration{' '}
                <Icon icon={ArrowRight01Icon} size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="public-final-cta">
        <Image alt="" height={76} src="/orvel-mark.png" width={76} />
        <p className="public-eyebrow">Make your expertise useful</p>
        <h2>Start building with Orvel.</h2>
        <Link className="public-primary-button" href="/agents#new-agent">
          Create your first agent <Icon icon={ArrowRight01Icon} size={17} />
        </Link>
      </section>

      <footer className="public-footer">
        <Link className="public-brand" href="/">
          <Image alt="Orvel" height={24} src="/orvel-mark.png" width={24} />
          <span>Orvel</span>
        </Link>
        <p>AI agents that get better with you.</p>
        <Link href="/agents">Open Studio</Link>
      </footer>
    </main>
  )
}
