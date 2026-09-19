import Link from 'next/link'

const foundations = [
  ['Brain', 'Choose a model through a provider-neutral boundary.'],
  ['Knowledge', 'Connect the sources an agent can retrieve from.'],
  ['Memory', 'Define what an agent can retain and recall.'],
  ['Skills', 'Give an agent explicit tools and actions.'],
  ['Training', 'Teach with examples, feedback, and corrections.'],
  ['Evals', 'Measure behavior with repeatable checks.'],
] as const

export default function Home() {
  return (
    <main>
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="Orvel Studio home">
          Orvel
        </Link>
        <span className="status">Foundation stage</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Orvel Studio</p>
        <h1 id="hero-title">Build intelligence that learns from you.</h1>
        <p className="lede">
          An early workspace for creating, teaching, evaluating, and eventually
          deploying AI agents.
        </p>
        <p className="notice">
          Studio is not functional yet. This shell establishes the interface
          where the first end-to-end workflows will be built.
        </p>
      </section>

      <section className="foundations" aria-labelledby="foundations-title">
        <div className="section-heading">
          <p className="eyebrow">Agent foundations</p>
          <h2 id="foundations-title">Teach the system, not just the prompt.</h2>
        </div>
        <div className="grid">
          {foundations.map(([name, description]) => (
            <article key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
