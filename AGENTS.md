# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UCD.js is a monorepo project that provides tools and APIs for working with Unicode Character Database (UCD) files in a more readable way. The project uses pnpm workspaces with Turbo for build orchestration and Vitest for testing.

## Monorepo Structure

The repository is organized into three main workspace categories:

- **packages/**: Core library packages published to npm
- **apps/**: Applications (API worker, web - includes documentation)
- **tooling/**: Internal development tools (eslint-plugin, tsconfig, tsdown-config, moonbeam)
- **vscode/**: VS Code extension

### Key Packages

- **@ucdjs/ucd-store**: Store for managing Unicode Character Database files. Supports multiple file system bridges (Node.js, HTTP, in-memory). Core operations include mirror, analyze, and clean.
- **@ucdjs/ucd-store**: Next-generation store with lockfile and snapshot support.
- **@ucdjs/lockfile**: Lockfile and snapshot management utilities for UCD stores. Provides file hashing, lockfile/snapshot validation, and test utilities.
- **@ucdjs/schema-gen**: Uses AI (OpenAI) to generate TypeScript schemas from Unicode data files
- **@ucdjs/cli**: Command-line interface for UCD operations (binary: `ucd`)
  > Currently uses `@ucdjs/ucd-store` and `@ucdjs/lockfile` under the hood.
- **@ucdjs/client**: OpenAPI-based API client for the UCD API
- **@ucdjs/fs-bridge**: File system abstraction layer that allows different storage backends
- **@ucdjs/schemas**: Zod schemas for Unicode data files (includes lockfile and snapshot schemas)
- **@ucdjs-internal/shared**: Internal Shared utilities across packages
  > NOTE: This package may not follow semantic versioning, as it's only for internal use
  > Changes here may require coordinated updates in other packages
- **@ucdjs/utils**: General utilities
- **@ucdjs/env**: Environment configuration
- **@ucdjs/path-utils**: Path manipulation utilities

### Key Apps

- **apps/api**: Cloudflare Workers API using Hono and OpenAPI (serves at api.ucdjs.dev)
- **apps/web**: Web application using React, Vite, and TanStack Router (includes documentation at /docs)
  > Uses fumadocs framework for documentation with content in `apps/web/content/docs/`

## Common Commands

### Setup
```bash
pnpm install                    # Install all dependencies
```

### Building
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

### Testing
```bash
pnpm test                       # Run all tests
pnpm test:watch                 # Run tests in watch mode
pnpm test:ui                    # Run tests with Vitest UI
vitest run --project=ucd-store  # Run tests for specific package
```

### Linting & Type Checking
```bash
pnpm lint                       # Lint all packages/apps
pnpm typecheck                  # Type-check all packages/apps
```

### API Worker (apps/api)
```bash
cd apps/api
pnpm dev                        # Start local dev server on :8787
pnpm build:openapi             # Generate OpenAPI spec
pnpm lint:openapi              # Lint OpenAPI spec with Spectral
pnpm deploy                    # Deploy to Cloudflare Workers
```

### Clean
```bash
pnpm clean                      # Clean build artifacts and node_modules
```

## Architecture Notes

### Build System
- Uses **tsdown** for building TypeScript packages (each package has its own tsdown.config.ts using @ucdjs-tooling/tsdown-config)
- Uses **Turbo** for task orchestration and caching
- Build dependencies are topologically sorted (see turbo.json)
- Packages output to `dist/` directories

### Testing Strategy
- **Vitest** for all tests with workspace-aware configuration
- Test projects are auto-generated for each package in `packages/`
- API app has both unit tests and worker tests (using @cloudflare/vitest-pool-workers)
- MSW (Mock Service Worker) is set up globally via test-utils for HTTP mocking
- Test file pattern: `**/*.{test,spec}.?(c|m)[jt]s?(x)`
- Test utilities available via path aliases (defined in vitest.config.ts):
  - `#test-utils/msw`
  - `#test-utils/mock-store`
  - `#test-utils`
- Internal test utilities (e.g. OS condition checks) are in `test/utils/` and imported via `#internal/test-utils/conditions`

  These aliases point directly to the source files (`packages/test-utils/src/`) instead of using the built package (`@ucdjs/test-utils`). This approach:
  - Eliminates the build step requirement for test-utils during development
  - Prevents cyclic dependency issues when packages import test-utils in their test files
  - Allows tests to run without requiring test-utils to be built first

#### Testing Patterns

**Using mockStoreApi():**
The `mockStoreApi()` utility from `#test-utils/mock-store` provides MSW-based mocking for the UCD API:

```typescript
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";

beforeEach(() => {
  mockStoreApi({
    baseUrl: "https://api.ucdjs.dev",
    responses: {
      "/api/v1/versions": ["16.0.0", "15.1.0"],
      "/api/v1/files/{wildcard}": () => HttpResponse.text("File content"),
    },
  });
});
```

**Filesystem Testing:**
Use `testdir()` from `vitest-testdirs` to create temporary test directories:

```typescript
import { testdir } from "vitest-testdirs";

it("should work with filesystem", async () => {
  const storePath = await testdir();
  // storePath is automatically cleaned up after the test
});
```

**Worker Testing:**
The API app uses a separate Vitest project configuration (`vitest.config.ts`) with:
- `@cloudflare/vitest-pool-workers` for Cloudflare Workers environment
- Miniflare bindings for rate limiting and environment variables
- Tests in `apps/api/test/**` (all tests run in Cloudflare Workers environment, unit tests use mocks)

### Package Dependencies
- Uses pnpm **catalogs** for centralized dependency version management
- Catalogs are organized by purpose: monorepo, testing, linting, prod, dev, workers, types, web, vscode, docs
- Workspace packages use `workspace:*` protocol

### File System Bridge Pattern
The `@ucdjs/fs-bridge` package provides an abstraction layer for file system operations. This allows `@ucdjs/ucd-store` to work with different storage backends:
- Node.js file system (for CLI and Node.js environments)
- HTTP (for browser/worker environments accessing remote files)
- In-memory (for testing and ephemeral storage)

### API Architecture
The API (apps/api) is a Cloudflare Worker built with:
- **Hono** web framework with OpenAPI plugin (@hono/zod-openapi)
- Routes organized by version and type:
  - `/api/v1/files` - File access and search endpoints
  - `/api/v1/versions` - Version metadata and file trees
  - `/api/v1/schemas` - JSON schemas (lockfile.json, snapshot.json)
  - `/_tasks` - Internal admin endpoints (requires API key)
  - `/.well-known/` - Well-known endpoints (ucd-config, ucd-store)
- OpenAPI spec auto-generated from Zod schemas
- Scalar API documentation served at root (`/`)
- Environment-aware (local, preview, production)

### Schema Generation Workflow
The `@ucdjs/schema-gen` package uses OpenAI to generate TypeScript type definitions from Unicode data files:
1. Reads raw Unicode data files
2. Uses AI to infer field types and descriptions
3. Generates TypeScript interfaces using knitwork

### Internal Development Tools

#### Moonbeam (@ucdjs/moonbeam)
Moonbeam is a critical internal ESM loader that resolves workspace packages to their source files instead of built versions. This is essential because tsx doesn't handle tsconfig paths in referenced projects.

**When to use:**
- Running build scripts that import workspace packages
- Executing scripts during development without building dependencies first

**Usage:**
```bash
# With tsx (recommended)
tsx --import @ucdjs/moonbeam/register ./your-script.ts

# With Node.js 24.13+
node --import @ucdjs/moonbeam/register ./your-script.ts
```

**How it works:**
1. Auto-discovers workspace packages by scanning pnpm-workspace.yaml
2. Resolves imports to `packages/*/src/` first, falls back to `packages/*/dist/`
3. Handles subpath imports like `@ucdjs/package/submodule`

**Example:** The API's `build:openapi` script uses Moonbeam to import workspace packages without requiring them to be built first.

## Development Guidelines

### Running Individual Package Tests
Since the test configuration uses workspace aliases, tests must be run from the repository root:
```bash
vitest run --project=cli        # NOT: cd packages/cli && pnpm test
```

### Working with the API
- OpenAPI spec generation is a build dependency (see turbo.json)
- Always run `pnpm build:openapi` after changing API routes/schemas
- The `@ucdjs/client` package types are auto-generated from the OpenAPI spec

### Wrangler Deployment Environments

The API worker (apps/api) has multiple deployment environments configured in `wrangler.jsonc`:

- **local**: Development environment
  - Runs on `localhost:8787`
  - Started with `pnpm dev`
  - `ENVIRONMENT=local`

- **preview**: Preview deployments
  - URL: `preview.api.ucdjs.dev`
  - Build with `pnpm build:preview`
  - `ENVIRONMENT=preview`

- **production**: Live production environment
  - URL: `api.ucdjs.dev`
  - Deploy with `pnpm deploy` (from apps/api)
  - `ENVIRONMENT=production`

- **testing**: Used by worker tests
   - Configured in `apps/api/vitest.config.ts`
   - Uses miniflare bindings for isolated testing

### Common Gotchas & Debugging

1. **Tests must run from repository root**
   - ❌ `cd packages/cli && pnpm test`
   - ✅ `vitest run --project=cli`
   - Reason: Workspace aliases in vitest.config.ts are relative to root

2. **OpenAPI spec regeneration**
   - After changing API routes or Zod schemas, always run `cd apps/api && pnpm build:openapi`
   - This regenerates `<repository-root>/ucd-generated/api/openapi.json` which is used by `@ucdjs/client`
   - It's a build dependency in turbo.json, so full builds will regenerate it

3. **Using #test-utils in tests**
   - Import from `#test-utils/*`, not `@ucdjs/test-utils`
   - This avoids needing to build test-utils before running tests
   - Prevents cyclic dependency issues

4. **Running scripts with workspace imports**
   - Use `tsx --import @ucdjs/moonbeam/register` for scripts that import workspace packages
   - Without Moonbeam, imports resolve to node_modules instead of source files

5. **Worker tests vs unit tests**
   - All API tests run in Cloudflare Workers environment via vitest.config.ts
   - Worker tests: `apps/api/test/routes/**` - test actual API endpoints and routes
   - Unit tests: `apps/api/test/unit/**` - test individual functions with mocks (e.g., cache, handlers, errors)
   - Use the correct test location based on what you're testing

### Adding New Packages
1. Create package directory under `packages/`
2. Add to pnpm-workspace.yaml if needed (already has `packages/*` glob)
3. Use shared tooling configs:
   - `@ucdjs-tooling/tsconfig` for TypeScript
   - `@ucdjs-tooling/tsdown-config` for builds
   - `@luxass/eslint-config` for linting

### Node Version
- Requires Node.js >= 24.13
- pnpm 10.26.1 (enforced via packageManager field)
