# UCD.js Code Style and Standards Instructions

Code style guidelines, standards, and frequently used commands for the UCD.js monorepo.

## Package.json Scripts

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

## Command Timing Standards

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

### Development Commands
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build packages
pnpm build

# Build applications  
pnpm build:apps

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm typecheck

# Start development servers
pnpm dev        # For packages
pnpm dev:apps   # For applications
```

### Repository Management
```bash
# Clean build artifacts
pnpm clean

# Clean all node_modules and reinstall
git clean -xdf node_modules
pnpm install --frozen-lockfile

# Check repository structure
ls -la
```

## Code Quality Standards

- Always run linting before committing: `pnpm lint`
- Always run type checking before committing: `pnpm typecheck`  
- Always run tests before committing: `pnpm test`
- Use the build pipeline compliance commands from testing.instructions.md
- Follow the timing expectations - never cancel long-running commands early

## Monorepo Structure Standards

- Applications go in `apps/`
- Reusable packages go in `packages/`
- Build configuration in root: `turbo.json`, `pnpm-workspace.yaml`
- Test configuration in root: `vitest.config.ts`
- Use Turbo for build orchestration with appropriate filters
- Use pnpm workspaces for dependency management