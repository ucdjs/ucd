# Skills Required for UCD.js Development

Skills and knowledge areas needed to contribute to UCD.js.

## Core Programming Languages

### TypeScript/JavaScript (Essential)

Primary language for packages, apps, and tooling.

**Required skills:**

- **TypeScript**: type system, generics, utility types
- **Modern JavaScript**: ESM, async/await, modules
- **Node.js**: filesystem, streams, process/env, fetch
- **Package management**: pnpm workspaces, workspace:* dependencies

**Key packages:**

- @ucdjs/ucd-store
- @ucdjs/pipelines-*
- @ucdjs/cli
- @ucdjs/client
- @ucdjs/schemas

**Resources:**

- https://www.typescriptlang.org/docs/handbook/intro.html
- https://nodejs.org/docs/

## Platform and Tooling

### Monorepo Management (Essential)

**Skills:**

- pnpm workspaces and catalogs (pnpm-workspace.yaml)
- Turbo task orchestration and filters
- Using repo-root scripts for builds/tests

### Build and Test Tooling (Essential)

**Skills:**

- tsdown builds for packages
- Vitest for unit/integration tests
- MSW-based HTTP testing with mockFetch

## API and Store

### API (Essential)

**Skills:**

- Cloudflare Workers
- Hono routing and middleware
- OpenAPI generation from Zod
- Versioned API design (v1)

### Store (Essential)

**Skills:**

- Store URL layout and stability
- Direct file access semantics
- Interactions with fs-bridge and clients

## Storage and Data

### Store + Bridge Stack (Essential)

**Skills:**

- fs-bridge backends (Node.js, HTTP, in-memory)
- ucd-store file access and metadata
- lockfile/snapshot integrity handling

### Pipelines (Essential)

**Skills:**

- Pipeline definitions and presets
- Pipeline execution and artifacts
- Graph execution ordering

## Testing and Quality

### Testing Patterns (Essential)

**Skills:**

- Vitest patterns and project scoping
- MSW request mocking via #test-utils/msw
- Reusable helpers via @ucdjs/test-utils

### Code Quality (Essential)

**Skills:**

- Linting with pnpm lint
- Type checking with pnpm typecheck
- Avoiding edits to generated output

## UI and Docs

### UI (Helpful)

**Skills:**

- Shared UI components in @ucdjs-internal/shared-ui
- apps/web and apps/store patterns

### Docs (Helpful)

**Skills:**

- apps/docs structure
- docs.ucdjs.dev content flow

## Domain Knowledge

### Unicode Character Database (UCD)

**Skills:**

- UCD file formats and metadata
- Unicode versioning and file layouts
- Common UCD file categories (core, emoji, extracted)

## Learning Path Recommendations

### For New Contributors

1. Set up the repo and run `pnpm install`.
2. Run a targeted test with `vitest run --project=<project>`.
3. Make a small change and verify with lint/typecheck as needed.
4. Read .agents/ARCHITECTURE.md and .agents/COMMON_PATTERNS.md.

### For Pipeline Work

1. Review pipelines-core and pipelines-executor.
2. Check presets before creating new pipeline definitions.
3. Update artifacts/tests when pipeline outputs change.

### For API/Store Work

1. Review .agents/API_DESIGN.md.
2. Update OpenAPI spec after route/schema changes.
3. Ensure store URL layouts remain stable.

## Resources

- .agents/ARCHITECTURE.md
- .agents/API_DESIGN.md
- .agents/CODE_STYLE.md
- .agents/COMMON_PATTERNS.md
- .agents/GLOSSARY.md
- https://docs.ucdjs.dev
