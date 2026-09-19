# `@orvel/runtime`

The core execution layer for Orvel agents. It owns provider-neutral agent,
conversation, model-provider, and explicit runtime-context contracts. It selects
a registered provider, composes instructions plus retrieved context and message
history, then delegates the run.

The package does not contain a hosted-provider adapter, persistence, a tool loop,
or deployment behavior. Provider adapters and storage live in separate packages.
