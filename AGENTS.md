# AGENTS.md

This file is the single source of truth for how agents should work in this repository. If anything here conflicts with other docs, follow this file and then update the docs.

Docs:
- https://docs.ucdjs.dev
- apps/docs (source for the docs site)

## How to Work Here

- Keep changes scoped to the request and avoid unrelated refactors.
- Prefer existing conventions in the codebase over new patterns.
- Ask a question only when blocked by missing information that changes the outcome.
- Run tests and builds that are directly related to your changes; state what you did.
- Never revert user changes unless explicitly asked.

## Project Snapshot

UCD.js is a monorepo that provides tools and APIs for working with Unicode Character Database (UCD) files. It uses pnpm workspaces, Turbo for orchestration, and Vitest for testing.

### Monorepo Structure

- packages/: core libraries published to npm
- apps/: applications (API worker, store, web, docs)
- tooling/: internal development tools (eslint-plugin, tsconfig, tsdown-config, moonbeam)
- vscode/: VS Code extension

### Key Packages

Keep this list in sync with packages/. If you add, remove, or rename packages, update this section.

#### Storage and Filesystem

- @ucdjs/ucd-store: store for UCD files, supports multiple file system bridges
- @ucdjs/fs-bridge: file system abstraction for multiple backends
- @ucdjs/lockfile: lockfile and snapshot management utilities

#### API and CLI

- @ucdjs/cli: command-line interface (binary: ucd)
- @ucdjs/client: OpenAPI-based API client

#### Schemas and Generation

- @ucdjs/schemas: Zod schemas for Unicode data files
- @ucdjs/schema-gen: generates TypeScript schemas from Unicode data files

#### Pipelines (Primary Extraction Path)

- @ucdjs/pipelines-core: pipeline definitions and core types
- @ucdjs/pipelines-graph: graph utilities for pipeline execution
- @ucdjs/pipelines-executor: pipeline execution engine
- @ucdjs/pipelines-loader: pipeline loading and resolution
- @ucdjs/pipelines-presets: shared pipeline presets
- @ucdjs/pipelines-artifacts: artifacts storage helpers
- @ucdjs/pipelines-ui: UI components for pipelines
- @ucdjs/pipelines-server: pipeline server runtime
- @ucdjs/pipelines-playground: local pipeline playground

#### UI and Frontend

- @ucdjs-internal/shared-ui: shared UI components and styles

#### Shared Utilities

- @ucdjs/utils: general utilities
- @ucdjs/env: environment configuration
- @ucdjs/path-utils: path manipulation utilities
- @ucdjs/test-utils: shared test helpers and MSW integrations

#### Internal Utilities

- @ucdjs-internal/shared: internal shared utilities (not semver)
- @ucdjs-internal/worker-utils: Cloudflare worker utilities and bindings

#### Tooling and Scripts

- @ucdjs/ucdjs-scripts: internal scripts used by repo tooling

### Key Apps

- apps/api: Cloudflare Workers API using Hono and OpenAPI (api.ucdjs.dev)
- apps/store: store app
- apps/web: web app
- apps/docs: documentation site source for docs.ucdjs.dev

## Common Workflows

### Setup
```bash
pnpm install                    # Install all dependencies
```

### Build
```bash
pnpm build                      # Build all packages (in packages/*)
pnpm build:apps                 # Build all apps (in apps/*)
turbo run build --filter "@ucdjs/cli"  # Build a specific package
```

### Development
```bash
pnpm dev                        # Watch mode for all packages
pnpm dev:apps                   # Watch mode for all apps
cd packages/cli && pnpm dev     # Watch mode for specific package
```

> [!NOTE]
> For development, you can use `pnpm dev` for packages and `pnpm dev:apps` for apps.
> If you're working on both, you can run them in separate terminals.
> For CLI work, run the CLI from the repo root with a relative path to ensure it picks up local packages without needing to build them first, e.g. `./packages/cli/bin/ucd.js <command>`.
> For API work, start the API dev server and then use the CLI with a repo-root relative path.

### Testing
```bash
pnpm test                       # Run all tests
pnpm test:watch                 # Run tests in watch mode
pnpm test:ui                    # Run tests with Vitest UI
vitest run --project=ucd-store  # Run tests for specific package
```

### Lint and Typecheck
```bash
pnpm lint                       # Lint all packages/apps
pnpm typecheck                  # Type-check all packages/apps
```

### API Worker (apps/api)
```bash
cd apps/api
pnpm dev                        # Start local dev server on :8787
pnpm build:openapi              # Generate OpenAPI spec
pnpm lint:openapi               # Lint OpenAPI spec with Spectral
pnpm deploy                     # Deploy to Cloudflare Workers
```

### Clean
```bash
pnpm clean                      # Clean build artifacts and node_modules
```

## Architecture Notes

### Build System
- Uses tsdown for TypeScript package builds via @ucdjs-tooling/tsdown-config
- Turbo orchestrates builds and caching
- Packages output to dist/ directories

### Testing Strategy
- Vitest for all tests with workspace-aware configuration
- Test projects are auto-generated for each package in packages/
- API app tests run in Cloudflare Workers via @cloudflare/vitest-pool-workers
- Test file pattern: **/*.{test,spec}.?(c|m)[jt]s?(x)
- Test utilities available via path aliases: #test-utils/msw, #test-utils/mock-store, #test-utils
- Prefer mockFetch from #test-utils/msw for HTTP/MSW-driven tests; it wires MSW with fetch helpers and supports OpenAPI path params.
- Use @ucdjs/test-utils (via #test-utils/*) for reusable helpers across packages; only keep local helpers when they are truly single-use.

Example:
```ts
import { HttpResponse, mockFetch } from "#test-utils/msw";

mockFetch([
  ["GET", "https://api.ucdjs.dev/api/v1/versions", () => {
    return HttpResponse.json(["16.0.0", "15.1.0"]);
  }],
]);
```

### File System Bridge Pattern
@ucdjs/fs-bridge provides an abstraction for Node.js, HTTP, and in-memory backends.

### Package Dependencies
- Uses pnpm catalogs for centralized dependency version management.
- Catalogs are organized by purpose: build, test, lint, runtime, backend, types, frontend, vscode, docs.

### API Architecture
- Hono with OpenAPI plugin (@hono/zod-openapi)
- Routes: /api/v1/files, /api/v1/versions, /api/v1/schemas, /_tasks, /.well-known/
- OpenAPI spec auto-generated from Zod schemas and served at root

### Internal Development Tools

#### Moonbeam (@ucdjs/moonbeam)
Use Moonbeam when running scripts that import workspace packages without building them first.

```bash
tsx --import @ucdjs/moonbeam/register ./your-script.ts
node --import @ucdjs/moonbeam/register ./your-script.ts
```

## Gotchas and Debugging

1. Tests must run from repository root.
2. After changing API routes or Zod schemas, run `pnpm build:openapi` in apps/api.
3. Import from #test-utils/* in tests instead of @ucdjs/test-utils.
4. Use Moonbeam for scripts that import workspace packages.
5. Worker tests live in apps/api/test/routes; unit tests in apps/api/test/unit.

## Reference

### Running Individual Package Tests
```bash
pnpm test --project=cli        # Run tests for specific package
```

### Wrangler Environments (apps/api)
- local: localhost:8787, ENVIRONMENT=local
- preview: preview.api.ucdjs.dev, ENVIRONMENT=preview
- production: api.ucdjs.dev, ENVIRONMENT=production
- testing: configured in apps/api/vitest.config.ts

### Node Version
- Node.js >= 24.13
- pnpm 10.30.0 (packageManager field)
