# Contributing to Orvel

Orvel is at an early architecture stage. Contributions that keep the foundation
small, provider-neutral, and easy to understand are especially valuable.

## Before opening a change

- Search existing issues and pull requests.
- For a new subsystem or a significant public API, open an issue first so the
  use case and package boundary can be discussed.
- Keep a pull request focused on one concern.
- Do not add a provider-specific assumption to a shared contract when a generic
  capability will do.

## Local workflow

```bash
corepack enable
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

Add tests when introducing executable behavior. Contract-only changes should
include clear types and documentation rather than placeholder implementations.

## Pull requests

Explain the problem, the scope of the solution, and any public API decisions.
Update relevant package documentation when responsibilities or boundaries
change. Avoid unrelated formatting or dependency changes.

## License status

The project has not selected a license yet. Please raise licensing questions
before contributing substantial work that depends on a particular license.
