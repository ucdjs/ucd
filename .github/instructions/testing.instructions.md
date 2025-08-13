# UCD.js Testing Instructions

Instructions for testing and validation in the UCD.js monorepo.

## Testing and Validation

- Run tests: `pnpm test` -- takes ~10s. NEVER CANCEL. Set timeout to 60+ seconds.
- Run linting: `pnpm lint` -- takes ~35s. NEVER CANCEL. Set timeout to 120+ seconds.
- Run type checking: `pnpm typecheck` -- takes ~25s. NEVER CANCEL. Set timeout to 120+ seconds.

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

## Test Results Summary
- Total test files: 33 passed
- Total tests: 604 passed, 6 todo
- Test duration: ~8-10 seconds
- Includes unit tests, integration tests, and Cloudflare Worker tests

## Testing Timing Expectations

**CRITICAL: NEVER CANCEL these commands - they require the full time to complete:**

| Command | Expected Time | Timeout Setting |
|---------|---------------|-----------------|
| `pnpm test` | ~10s | 60+ seconds |
| `pnpm lint` | ~35s | 120+ seconds |
| `pnpm typecheck` | ~25s | 120+ seconds |