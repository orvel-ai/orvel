# Development

Orvel uses pnpm workspaces and Turborepo. Workspace packages are private while
the public API is still taking shape, which prevents accidental publication.

## Commands

- `pnpm dev` starts Orvel Studio in development mode.
- `pnpm build` builds packages in dependency order and then Studio.
- `pnpm lint` runs the shared ESLint configuration.
- `pnpm typecheck` checks every TypeScript workspace.
- `pnpm test` builds and runs tests for workspaces that contain executable
  behavior.
- `pnpm format` applies the shared Prettier configuration.
- `pnpm format:check` verifies formatting without modifying files.

Build outputs are written to `dist/` for libraries and `.next/` for Studio. Both
are ignored by Git and declared as Turborepo outputs.

## Adding a package

Give a package one clear responsibility, mark it private until publication is an
explicit decision, and extend the root TypeScript configuration. Add executable
code only when there is behavior to implement; a README can be enough for a
future area.

Use `workspace:*` for internal dependencies so local packages are always used
during development.
