# Architecture

Orvel is organized around the parts of an agent that should be able to evolve
independently. The current code intentionally defines only the first useful
contracts and one small execution path.

## Dependency direction

```text
Studio ──► SDK ──► focused packages
                    │
                    ├── runtime
                    ├── memory
                    ├── knowledge
                    ├── skills
                    ├── training
                    └── evals
```

The focused packages do not depend on each other today. The SDK is the public
entry point that composes and re-exports their contracts. Studio will consume
public APIs rather than reach into package internals as features are added.

## Runtime and model providers

`@orvel/runtime` owns agent execution. A `ModelProvider` translates Orvel's
provider-neutral request into a provider implementation and returns a normalized
response. The runtime chooses a registered provider from the agent's brain
configuration and delegates generation.

Provider SDKs, credentials, HTTP transports, retry policies, streaming, tool
loops, and persistence are deliberately outside the initial runtime. They should
be introduced only when a concrete end-to-end use case establishes the required
contract.

## Focused packages

- `@orvel/memory` defines how memories are stored and recalled.
- `@orvel/knowledge` defines how relevant source material is retrieved.
- `@orvel/skills` defines executable actions and their context.
- `@orvel/training` defines teaching examples and feedback records.
- `@orvel/evals` defines cases, evaluators, and normalized results.

These packages currently expose contracts, not pretend storage engines or
provider integrations. Implementations can live in separate packages once their
requirements are understood.

## Versioning and deployment

Agent versioning and deployment are part of the project direction but do not yet
have packages or APIs. Their boundaries will be designed from working use cases
rather than guessed in advance.
