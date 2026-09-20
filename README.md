# Orvel

**Create, teach, evaluate, and deploy AI agents.**

Orvel is an open-source platform for building AI agents that can be taught and
improved over time. The goal is to make creating an agent feel less like wiring
together prompts and tools and more like teaching something how to think and
work.

> [!IMPORTANT]
> Orvel v0.1 implements a local-first teaching loop: create an agent, chat,
> save a correction, retrieve relevant corrections for later questions, and run
> a simple deterministic eval. It is not model fine-tuning or a production-ready
> agent platform, and its APIs will change.

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

## v0.1: contextual teaching

v0.1 proves the idea of teaching an agent without changing model weights:

1. Create an agent with provider-neutral model configuration and instructions.
2. Chat with it and save a correction for an assistant response.
3. Orvel persists the structured teaching locally.
4. A later related question uses lexical retrieval, or optional local hybrid
   lexical-plus-semantic retrieval.
5. Matching teachings are formatted as explicit creator-supplied context and
   passed to the configured provider.

Studio supports Agents, Chat, Teachings, and Evals. Run models locally through
Ollama or use hosted inference through Groq or OpenAI. Provider calls remain
server-side; no API key is sent to the browser.

See [docs/v0.1-teaching.md](docs/v0.1-teaching.md) for the exact behavior and
limitations.

For optional private semantic retrieval via a locally running Ollama embedding
model, see [docs/semantic-teaching-retrieval.md](docs/semantic-teaching-retrieval.md).

## Development

### Requirements

- Node.js 20.9 or newer
- Corepack (included with supported Node.js releases)

### Setup

```bash
corepack enable
pnpm install
cp .env.example apps/studio/.env.local
pnpm dev
```

`pnpm dev` starts Orvel Studio at <http://localhost:3000>.

### Run locally with Ollama (no paid API key)

Install and start [Ollama](https://ollama.com/), then pull any compatible local
model. For a lightweight development option, `llama3.2:3b` is one possible
choice; model names stay configurable in Orvel.

```bash
ollama pull llama3.2:3b
pnpm dev
```

In Studio, select **Ollama (Local)**, enter or choose the pulled model, and
create an agent. Ollama defaults to `http://localhost:11434`; set
`OLLAMA_BASE_URL` in `apps/studio/.env.local` only when it runs elsewhere.

OpenAI remains optional and requires `OPENAI_API_KEY` only for OpenAI-backed
agents. Without either an OpenAI key or a running Ollama server, Studio still
lets you create and view agents but explains why a selected provider cannot run.

Ollama runs the underlying language model locally. Orvel provides the agent
runtime, teaching, memory/knowledge architecture, evaluation, and surrounding
agent behavior. v0.1 teachings are retrieved contextual corrections; they do
not modify a local model's weights.

### Run in the cloud with Groq or OpenAI

For fast hosted Groq inference, add `GROQ_API_KEY` to
`apps/studio/.env.local`, then select **Groq (Cloud)** in Studio. The editable
default is `openai/gpt-oss-20b`, an active Groq model when this documentation
was updated. Groq controls model availability and free-tier limits, which may
change.

For OpenAI-backed agents, set `OPENAI_API_KEY` and select **OpenAI (Cloud)**.
OpenAI usage may incur charges depending on your account. Either cloud key is
independent: a Groq-only setup does not need an OpenAI key.

Groq and OpenAI provide model inference. Orvel still provides the agent runtime,
teaching retrieval, persistence, evals, and surrounding agent behavior.

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
