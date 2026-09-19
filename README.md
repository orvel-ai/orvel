# Orvel

**Create, teach, evaluate, and deploy AI agents.**

Orvel is an open-source platform for building AI agents that can be taught and
improved over time. The goal is to make creating an agent feel less like wiring
together prompts and tools and more like teaching something how to think and
work.

> [!IMPORTANT]
> Orvel is at the foundation stage. The repository currently establishes core
> contracts, workspace tooling, and an early Studio shell. It is not yet a
> production-ready agent platform, and its APIs will change.

## Philosophy

An Orvel agent is intended to bring several independent systems together:

- **Brain** — a model accessed through a provider-neutral interface
- **Knowledge** — documents and other sources an agent can retrieve from
- **Memory** — information an agent can retain and use over time
- **Skills** — tools, APIs, and actions available to an agent
- **Training** — examples, demonstrations, feedback, and corrections
- **Evals** — repeatable checks of agent behavior
- **Versions** — reproducible snapshots of an agent
- **Deployment** — ways to run an agent locally or in production

Orvel is designed around explicit boundaries rather than a single model
provider. Hosted providers and local or open-weight models should be able to
implement the same runtime contract.

## Repository structure

```text
orvel/
├── apps/
│   └── studio/       # Early Next.js interface
├── packages/
│   ├── runtime/      # Agent execution and model-provider contracts
│   ├── memory/       # Memory contracts
│   ├── knowledge/    # Retrieval contracts
│   ├── skills/       # Tool/action contracts
│   ├── training/     # Teaching data contracts
│   └── evals/        # Evaluation contracts
├── sdk/              # Public developer-facing entry point
├── examples/         # Focused usage examples as features become usable
└── docs/             # Architecture and development documentation
```

Package boundaries are described in [docs/architecture.md](docs/architecture.md).

## Development

### Requirements

- Node.js 20.9 or newer
- Corepack (included with supported Node.js releases)

### Setup

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` starts Orvel Studio at <http://localhost:3000>.

### Checks

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

See [docs/development.md](docs/development.md) for workspace details and
[CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Project direction

The immediate focus is a small, understandable foundation: stable boundaries,
an executable runtime core, and a place to explore the teaching workflow. New
features should begin with a concrete use case and avoid coupling independent
systems together prematurely.

## License

No open-source license has been selected yet. Apache-2.0 is under consideration,
but adding a license remains an explicit project decision. Until a license is
added, normal copyright restrictions apply.
