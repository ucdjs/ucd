# UCD.js Setup Instructions

UCD.js is a TypeScript monorepo providing a Unicode Character Database (UCD) API, web interface, and CLI tools. The project consists of Cloudflare Workers API, React web frontend, and various utility packages.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Environment Setup

- Install Node.js 22.17.0 or higher:
  ```bash
  curl -fsSL https://nodejs.org/dist/v22.17.0/node-v22.17.0-linux-x64.tar.xz -o node-v22.17.0-linux-x64.tar.xz
  sudo tar -xf node-v22.17.0-linux-x64.tar.xz -C /usr/local --strip-components=1
  ```
- Verify Node.js version: `node --version` (should be v22.17.0+)
- Install pnpm globally: `npm install -g pnpm@10.14.0`

## Bootstrap and Build

- Install dependencies: `pnpm install --frozen-lockfile` -- takes ~2m 30s. NEVER CANCEL. Set timeout to 300+ seconds.
- Build packages: `pnpm build` -- takes ~25s. NEVER CANCEL. Set timeout to 180+ seconds.
- Build applications: `pnpm build:apps` -- takes ~10s. NEVER CANCEL. Set timeout to 60+ seconds.

## Common Setup Issues and Solutions

### Build failures
- Always ensure Node.js 22.17.0+ is installed
- Clear caches with: `pnpm clean` or `git clean -xdf node_modules`
- Reinstall dependencies: `pnpm install --frozen-lockfile`

### Network-dependent operations
- CLI store operations require internet access to Unicode.org
- API endpoints may return 500 errors in restricted network environments
- Use `--remote` flag for CLI operations that need network access

## Timing Expectations

**CRITICAL: NEVER CANCEL these commands - they require the full time to complete:**

| Command | Expected Time | Timeout Setting |
|---------|---------------|-----------------|
| `pnpm install` | ~2m 30s | 300+ seconds |
| `pnpm build` | ~25s | 180+ seconds |
| `pnpm build:apps` | ~10s | 60+ seconds |