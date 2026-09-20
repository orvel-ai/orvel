# Architecture

Orvel is organized around the parts of an agent that should be able to evolve
independently. The current code intentionally defines only the first useful
contracts and one small execution path.

## Dependency direction

```text
Studio server ──► SDK ──► runtime, training, evals
      │                         │
      ├── local store ───────────┤
      ├── OpenAI adapter ────────┘
      └── Ollama adapter ────────┘
      └── Groq adapter ──────────┘

Other focused packages: memory, knowledge, skills
```

The focused packages do not depend on each other today. The SDK is the public
entry point that composes and re-exports their contracts. Studio will consume
public APIs rather than reach into package internals as features are added.

## Runtime and model providers

`@orvel/runtime` owns agent execution. A `ModelProvider` translates Orvel's
provider-neutral request into a provider implementation and returns a normalized
response. The runtime chooses a registered provider from the agent's brain
configuration and delegates generation.

The runtime now composes instructions, explicit runtime context, and conversation
messages before delegating to a provider. It does not know how teachings are
retrieved, how data is persisted, or how any provider's HTTP API works.

`@orvel/openai`, `@orvel/ollama`, and `@orvel/groq` are provider adapters.
OpenAI and Groq use server-supplied keys; Ollama uses its local HTTP API with no
key. All implement `ModelProvider`; no provider package is imported by the
runtime.

## Focused packages

- `@orvel/memory` defines how memories are stored and recalled.
- `@orvel/knowledge` defines how relevant source material is retrieved.
- `@orvel/skills` defines executable actions and their context.
- `@orvel/training` defines teaching examples, deterministic lexical and hybrid
  retrieval, the provider-neutral embedding contract, and inspectable
  teaching-context construction. `@orvel/ollama` optionally implements that
  embedding contract through its local API; the runtime remains unaware of it.
- `@orvel/evals` defines cases, normalized results, and the v0.1 contains-text
  evaluator.
- `@orvel/local` implements the repository contracts as atomic JSON-file
  persistence for local development.

`@orvel/sdk` composes repositories, retrieval, and the runtime into a reusable
developer-facing client. Studio consumes that client from server components and
server actions; it does not contain core agent behavior.

## Versioning and deployment

Agent versioning and deployment are part of the project direction but do not yet
have packages or APIs. Their boundaries will be designed from working use cases
rather than guessed in advance.
