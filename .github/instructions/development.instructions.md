# UCD.js Development Instructions

Instructions for development workflows in the UCD.js monorepo.

## Development Servers

### Web Application (React + Vite)
- Start development server: `cd apps/web && pnpm dev`
- Runs on: http://localhost:5173
- Note: You may see "Unable to fetch the Request.cf object" warnings - this is normal in local development

### API (Cloudflare Worker)
- Start development server: `cd apps/api && npx wrangler dev --port 8788 --inspector-port 9230`
- Runs on: http://localhost:8788
- API documentation available at: http://localhost:8788
- OpenAPI spec at: http://localhost:8788/openapi.json
- **TROUBLESHOOTING**: If you get "Address already in use" error, change the inspector port: `--inspector-port 9231`

### CLI Tool
- Location: `./packages/cli/bin/ucd.js`
- Help: `./packages/cli/bin/ucd.js --help`
- Store commands: `./packages/cli/bin/ucd.js store --help`
- Initialize store: `./packages/cli/bin/ucd.js store init --remote --store-dir ./ucd-data`

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

## Common Development Issues

### Port conflicts
- If port 8787 or 9229 is in use, change API server ports: `--port 8788 --inspector-port 9230`
- Web dev server uses port 5173 by default

### Network-dependent operations
- CLI store operations require internet access to Unicode.org
- API endpoints may return 500 errors in restricted network environments
- Use `--remote` flag for CLI operations that need network access

## Repository Root Layout
```bash
ls -la
# Contains: package.json, turbo.json, pnpm-workspace.yaml, vitest.config.ts
# Apps: apps/api, apps/web
# Packages: packages/cli, packages/ucd-store, etc.
```