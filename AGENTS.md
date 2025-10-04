# Codebase Rules

This file provides guidance to AI agents and contributors working with the UCD.js codebase.

## Project Overview

UCD.js is a TypeScript monorepo for working with the Unicode Character Database in a more readable way. It provides libraries, CLI tools, and web applications for Unicode data processing and analysis.

- **Package Manager**: pnpm with workspace support
- **Build System**: Turbo for orchestration, tsdown for packages, Vite for apps
- **Node Version**: >= 22.17
- **TypeScript**: 5.9.2

## Project Structure

This is a pnpm monorepo with TypeScript packages and applications.

### Core Directories

- `packages/` - Core functionality (start here when exploring)
- `apps/` - Applications (API server, web frontend)
- `tooling/` - Development tools and configurations

### Key Packages

#### Unicode Data Management
- `ucd-store/` - Core Unicode data store and management (primary package)
- `fetch/` - HTTP client with Unicode data fetching capabilities
- `schemas/` - Schema definitions for Unicode data structures

#### CLI and Tools
- `cli/` - Command-line interface for Unicode operations
- `schema-gen/` - Schema generation for Unicode field definitions

#### Infrastructure
- `fs-bridge/` - File system abstraction layer (HTTP + Node.js)
- `path-utils/` - Secure path manipulation utilities
- `shared/` - Common utilities (filtering, debugging, JSON handling)
- `utils/` - General utility functions
- `env/` - Environment variable management

### Applications

#### Production Apps
- `apps/api/` - Hono-based API server (Cloudflare Workers deployment)
- `apps/web/` - React frontend with TanStack Router (Cloudflare Pages)

### Development Tooling

#### Internal Tools
- `tooling/test-utils/` - Shared testing utilities and MSW setup
- `tooling/eslint-plugin/` - Custom ESLint rules for the project
- `tooling/tsconfig/` - Shared TypeScript configurations
- `tooling/tsdown-config/` - Build configuration utilities

### Key Locations

When exploring the codebase:
1. **Start with `packages/ucd-store/`** - The core package that manages Unicode data
2. **Check `apps/api/src/routes/`** - API endpoint implementations
3. **Review `tooling/test-utils/src/store-handlers/`** - Mock handlers for testing
4. **Examine `packages/fs-bridge/src/bridges/`** - File system abstraction implementations

## Setup and Development

### Installation
```bash
pnpm install
```

### Development Commands
- `pnpm dev` - Start development mode for packages (watch mode)
- `pnpm dev:apps` - Start development mode for applications
- `pnpm build` - Build all packages
- `pnpm build:apps` - Build applications

## Testing

The project uses a sophisticated multi-project vitest setup with advanced mocking capabilities:

### Test Commands
- `pnpm test` - Run all tests across all projects
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with interactive UI

### Test Architecture

#### Multi-Project Configuration
The root `vitest.config.ts` automatically discovers and configures test projects:
- **Package projects**: Each package in `./packages/*` gets its own test project
- **Worker unit tests**: App unit tests under `./apps/*/test/unit/**/*.test.ts`
- **Cloudflare Workers**: Dedicated worker test configuration for API integration tests

#### Test Types by Environment

1. **Package Tests** (`./packages/*/test/**/*.test.ts`)
   - Unit tests for individual packages
   - Uses Node.js environment with MSW for HTTP mocking
   - Examples: `ucd-store`, `path-utils`, `fs-bridge`, `cli`

2. **Worker Integration Tests** (`./apps/api/test/**/*.test.ts`)
   - Uses `@cloudflare/vitest-pool-workers` for Cloudflare Workers environment
   - Includes `fetchMock` for external API mocking
   - Tests actual worker behavior with Miniflare runtime
   - Configuration: `apps/api/vitest.config.worker.ts`

3. **Unit Tests** (`./apps/*/test/unit/**/*.test.ts`)
   - Isolated unit tests for app-specific logic
   - Node.js environment with standard vitest features

### Advanced Test Utilities

#### MSW (Mock Service Worker) Setup
Centralized HTTP mocking via `@ucdjs/test-utils-internal`:

```typescript
// Setup in test files
import { setupMockStore } from "#internal/test-utils/mock-store";

setupMockStore({
  baseUrl: "https://api.ucdjs.dev",
  responses: {
    "/api/v1/versions": [...UNICODE_VERSION_METADATA],
    "/api/v1/files/:wildcard": mockFileContent,
  },
});
```

**Key Features:**
- **Multi-method support**: Handles GET, POST, HEAD, etc. for single endpoints
- **Batch registration**: Configure multiple endpoints at once
- **Smart HEAD handling**: Automatically converts GET responses to HEAD responses
- **Pre-built responses**: `mockResponses.ok()`, `badRequest()`, `notFound()`, etc.
- **Store endpoint mocking**: Specialized handlers for Unicode data API endpoints

#### Test Directory Management
Uses `vitest-testdirs` for file system testing:

```typescript
import { testdir } from "vitest-testdirs";

const storePath = await testdir({
  "15.0.0": {
    "UnicodeData.txt": "Unicode data content",
    "extracted/DerivedBidiClass.txt": "Derived data",
  },
});
```

### Coverage Configuration
- **Provider**: Istanbul for code coverage
- **Include**: All `**/src/**` files
- **Exclude**: `tooling/*` directory
- **Reports**: HTML coverage reports in `./coverage/`

### Test Patterns and Best Practices

#### File System Bridge Testing
Tests for `@ucdjs/fs-bridge` cover multiple environments:
- HTTP bridge tests with mock servers
- Node.js bridge tests with real file system
- Capability requirement validation

#### Security Testing
Path manipulation security tests in `@ucdjs/path-utils`:
- Platform-specific tests (Unix/Windows)
- Path traversal attack prevention
- Sanitization validation

#### Store Operations Testing
Unicode store tests with realistic scenarios:
- File tree operations with nested directories
- Version management and validation
- Mock API responses for external Unicode.org data

### Environment-Specific Testing

#### Cloudflare Workers (API)
```typescript
// Worker environment testing
import { createExecutionContext, env, fetchMock } from "cloudflare:test";

const response = await worker.fetch(request, env, ctx);
```

#### Node.js (Packages)
Standard vitest configuration with MSW global setup for HTTP mocking.

### Test Aliases and Imports
Automatic alias resolution for internal dependencies:
- `@ucdjs/*` packages map to source files
- `#internal/test-utils/*` for test utilities
- Enables testing against source rather than built files

## Code Style and Conventions

### Linting and Type Checking
- `pnpm lint` - Run ESLint across all projects
- `pnpm typecheck` - Run TypeScript type checking

### Code Standards
- ESLint with `@luxass/eslint-config`
- All packages publish under `@ucdjs/` scope
- Prefer existing patterns and libraries in the codebase
- Follow security best practices (no secrets in code/commits)

## Common Workflows

### Adding New Features
1. Understand existing code conventions in the relevant package
2. Check dependencies are already available in the codebase
3. Write tests for new functionality
4. Run `pnpm lint` and `pnpm typecheck` before committing
5. Create changeset with `pnpm changeset`

### Working with Packages
- Each package has its own `tsdown.config.ts` for building
- Shared dependencies managed via pnpm catalogs
- Internal packages use workspace protocol (`workspace:*`)

### Deployment
- **API**: Cloudflare Workers via Wrangler
- **Web**: Cloudflare Pages via Vite

## Dependencies and Tools

### Key Dependencies
- **Build**: turbo, tsdown, vite
- **Testing**: vitest, msw, @vitest/ui
- **Linting**: eslint, @luxass/eslint-config
- **Runtime**: hono (API), react (web), yargs-parser (CLI)

### Development Tools
- **TypeScript**: Strict configuration across all packages
- **ESM**: ES modules throughout the codebase
- **Catalogs**: Centralized dependency management in `pnpm-workspace.yaml`

## Maintenance

### Cleanup
- `pnpm clean` - Clean all build artifacts and node_modules

### File Patterns to Understand
- `tsdown.config.ts` - Package build configuration
- `eslint.config.js` - Per-package linting rules
- `vitest.config.ts` - Test configuration with aliases
- `turbo.json` - Build orchestration and caching

## Performance Considerations

- Unicode data processing can be memory-intensive
- File system operations use abstraction layer (`fs-bridge`)
- HTTP requests use `openapi-fetch` with patched dependency
- Build system optimized with Turbo caching

## NEVER Edit These Files

### Auto-generated Files
- `packages/*/dist/**` - Build outputs
- `coverage/**` - Test coverage reports
- `node_modules/**` - Package dependencies

### Managed Files
- `pnpm-lock.yaml` - Dependency lock file (managed by pnpm)
- `apps/web/src/routeTree.gen.ts` - Auto-generated by TanStack Router
