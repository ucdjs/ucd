# UCD.js Development Instructions

UCD.js is a TypeScript monorepo providing a Unicode Character Database (UCD) API, web interface, and CLI tools. The project consists of Cloudflare Workers API, React web frontend, and various utility packages.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup
- Install Node.js 22.17.0 or higher:
  ```bash
  curl -fsSL https://nodejs.org/dist/v22.17.0/node-v22.17.0-linux-x64.tar.xz -o node-v22.17.0-linux-x64.tar.xz
  sudo tar -xf node-v22.17.0-linux-x64.tar.xz -C /usr/local --strip-components=1
  ```
- Verify Node.js version: `node --version` (should be v22.17.0+)
- Install pnpm globally: `npm install -g pnpm@10.14.0`

### Bootstrap and Build
- Install dependencies: `pnpm install --frozen-lockfile` -- takes ~2m 30s. NEVER CANCEL. Set timeout to 300+ seconds.
- Build packages: `pnpm build` -- takes ~25s. NEVER CANCEL. Set timeout to 180+ seconds.
- Build applications: `pnpm build:apps` -- takes ~10s. NEVER CANCEL. Set timeout to 60+ seconds.

### Testing and Validation
- Run tests: `pnpm test` -- takes ~10s. NEVER CANCEL. Set timeout to 60+ seconds.
- Run linting: `pnpm lint` -- takes ~35s. NEVER CANCEL. Set timeout to 120+ seconds.
- Run type checking: `pnpm typecheck` -- takes ~25s. NEVER CANCEL. Set timeout to 120+ seconds.

### Development Servers
#### Web Application (React + Vite)
- Start development server: `cd apps/web && pnpm dev`
- Runs on: http://localhost:5173
- Note: You may see "Unable to fetch the Request.cf object" warnings - this is normal in local development

#### API (Cloudflare Worker)
- Start development server: `cd apps/api && npx wrangler dev --port 8788 --inspector-port 9230`
- Runs on: http://localhost:8788
- API documentation available at: http://localhost:8788
- OpenAPI spec at: http://localhost:8788/openapi.json
- **TROUBLESHOOTING**: If you get "Address already in use" error, change the inspector port: `--inspector-port 9231`

#### CLI Tool
- Location: `./packages/cli/bin/ucd.js`
- Help: `./packages/cli/bin/ucd.js --help`
- Store commands: `./packages/cli/bin/ucd.js store --help`
- Initialize store: `./packages/cli/bin/ucd.js store init --remote --store-dir ./ucd-data`

## Validation Scenarios

ALWAYS run through at least one complete end-to-end scenario after making changes:

### CLI Workflow Validation
```bash
# Test CLI help system
./packages/cli/bin/ucd.js --help
./packages/cli/bin/ucd.js store --help
./packages/cli/bin/ucd.js store init --help

# Test store initialization (requires network access)
cd /tmp && mkdir test-ucd && cd test-ucd
/path/to/ucd/packages/cli/bin/ucd.js store init --remote --store-dir ./ucd-data
# This will show an interactive version selection prompt - verify it appears
```

### API Validation
```bash
# Start API server
cd apps/api && npx wrangler dev --port 8788 --inspector-port 9230

# Test endpoints in another terminal
curl -s http://localhost:8788 | head -10  # Should return HTML documentation
curl -s http://localhost:8788/openapi.json | head -10  # Should return OpenAPI spec
curl -s http://localhost:8788/api/v1/versions  # May return 500 due to network restrictions - this is expected
```

### Web Application Validation
```bash
# Start web server
cd apps/web && pnpm dev

# Test in another terminal
curl -s http://localhost:5173 | head -10  # Should return HTML with React app
```

## Build Pipeline Compliance

Always run these commands before committing to ensure CI compatibility:
```bash
pnpm build          # Build packages (25s timeout)
pnpm build:apps     # Build applications (60s timeout)
pnpm lint          # Lint all code (120s timeout)
pnpm typecheck     # Type check all packages (120s timeout)
pnpm test          # Run test suite (60s timeout)
```

The CI pipeline (.github/workflows/ci.yaml) runs these same commands in the following order:
1. Install dependencies with `pnpm install --frozen-lockfile`
2. Build packages with `pnpm build`
3. Build applications with `pnpm build:apps`
4. Run lint, typecheck, and test in parallel

## Project Structure

### Applications
- `apps/api/` - Cloudflare Worker API using Hono framework
- `apps/web/` - React web application using Vite and TailwindCSS

### Packages
- `packages/cli/` - Command-line interface for UCD operations
- `packages/ucd-store/` - Core Unicode data storage and management
- `packages/fetch/` - API client for UCD endpoints
- `packages/schemas/` - Shared schema definitions
- `packages/utils/` - Utility functions
- `packages/worker-shared/` - Shared code for Cloudflare Workers
- `packages/fs-bridge/` - File system abstraction layer
- `packages/env/` - Environment configuration utilities
- `packages/schema-gen/` - Schema generation tools

### Build Tools
- `turbo.json` - Turbo build configuration
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `vitest.config.ts` - Test configuration

## Common Issues and Solutions

### Network-dependent operations
- CLI store operations require internet access to Unicode.org
- API endpoints may return 500 errors in restricted network environments
- Use `--remote` flag for CLI operations that need network access

### Port conflicts
- If port 8787 or 9229 is in use, change API server ports: `--port 8788 --inspector-port 9230`
- Web dev server uses port 5173 by default

### Build failures
- Always ensure Node.js 22.17.0+ is installed
- Clear caches with: `pnpm clean` or `git clean -xdf node_modules`
- Reinstall dependencies: `pnpm install --frozen-lockfile`

## Timing Expectations

**CRITICAL: NEVER CANCEL these commands - they require the full time to complete:**

| Command | Expected Time | Timeout Setting |
|---------|---------------|-----------------|
| `pnpm install` | ~2m 30s | 300+ seconds |
| `pnpm build` | ~25s | 180+ seconds |
| `pnpm build:apps` | ~10s | 60+ seconds |
| `pnpm test` | ~10s | 60+ seconds |
| `pnpm lint` | ~35s | 120+ seconds |
| `pnpm typecheck` | ~25s | 120+ seconds |

## Frequently Used Commands

### Repository root
```bash
ls -la
# Contains: package.json, turbo.json, pnpm-workspace.yaml, vitest.config.ts
# Apps: apps/api, apps/web
# Packages: packages/cli, packages/ucd-store, etc.
```

### Package.json scripts
```json
{
  "build": "turbo run build --filter \"./packages/*\" --concurrency=15",
  "build:apps": "turbo run build --filter \"./apps/*\"",
  "dev": "turbo watch dev --filter \"./packages/*\"",
  "dev:apps": "turbo run dev --filter \"./apps/*\"",
  "lint": "turbo run lint",
  "test": "vitest run",
  "typecheck": "turbo run typecheck"
}
```

### Test results summary
- Total test files: 33 passed
- Total tests: 604 passed, 6 todo
- Test duration: ~8-10 seconds
- Includes unit tests, integration tests, and Cloudflare Worker tests