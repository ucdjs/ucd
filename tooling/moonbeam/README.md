# 🌙 Moonbeam

Module resolver for workspace packages in the UCD.js monorepo.

## Why this exists

tsx doesn't handle tsconfig paths in referenced projects ([tsx#96](https://github.com/privatenumber/tsx/issues/96)) - path mappings from workspace packages are ignored, causing imports to resolve to node_modules instead of source files.

This ESM loader ensures workspace packages resolve to their source files.

## Features

- Auto-discovers workspace packages
- Resolves to `src/` files when available, falls back to `dist/`
- Handles subpath imports like `@ucdjs/package/submodule`

## Usage

### With tsx
```bash
tsx --loader @ucdjs/moonbeam/esm ./your-script.ts
```

### With Node.js (22.6+)
```bash
node --import @ucdjs/moonbeam/register ./your-script.ts
```

### With Node.js loader
```bash
node --loader @ucdjs/moonbeam/esm ./your-script.ts
```

## How it works

Moonbeam intercepts Node.js module resolution and:

1. Detects workspace packages by scanning your monorepo
2. For workspace imports, resolves to `packages/*/src/index.ts` first
3. Falls back to built `packages/*/dist/index.js` if source doesn't exist
4. Handles subpath imports like `@org/package/utils` → `packages/package/src/utils.ts`

## Workspace Detection

Moonbeam automatically finds your workspace root by looking for:
- `pnpm-workspace.yaml` (pnpm workspaces)
- `package.json` with `workspaces` field (npm/yarn workspaces)

## Perfect for

- 🔧 Build scripts that need workspace dependencies
- 🧪 Testing across workspace packages
- 🏗️ Development tools and CLIs
- 📜 Scripts that import workspace packages

*Let moonbeam light the way to seamless monorepo development* ✨
