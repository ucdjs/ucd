# Critique: `packages/client` (`@ucdjs/client`)

## Validation

- `pnpm --dir packages/client run typecheck` -> passed
- `pnpm --dir packages/client run build` -> passed
- package-local `test` script -> none

## Findings

- The README is materially wrong. [packages/client/README.md](/Users/luxass/dev/ucdjs/ucd/packages/client/README.md) documents an OpenAPI-style `client.GET(...)` API, but the shipped surface in [packages/client/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/client/src/index.ts) exports `createUCDClient` and `createUCDClientWithConfig` resource wrappers instead.
- The package is carrying two client models at once. [packages/client/package.json](/Users/luxass/dev/ucdjs/ucd/packages/client/package.json) still has `generate:client` scripts for OpenAPI types, while runtime discovery in [packages/client/src/ucd-config.ts](/Users/luxass/dev/ucdjs/ucd/packages/client/src/ucd-config.ts) uses `/.well-known/ucd-config.json`. That split may be intentional, but it is not clearly documented and makes the package feel half-migrated.
- Typing is still patched at the boundary. [packages/client/src/ucd-config.ts](/Users/luxass/dev/ucdjs/ucd/packages/client/src/ucd-config.ts) relies on `@ts-expect-error` for build-time config injection.
- The package has tests under [packages/client/test](/Users/luxass/dev/ucdjs/ucd/packages/client/test), but no package-local `test` script. That keeps repeating the same tooling friction across the repo.
- The client needs a diagram showing discovery flow, default config injection, and resource layout. Right now that logic is spread across source, generated types, and stale docs.

## What is good

- The runtime surface is smaller and more understandable than the README suggests.
- Build and typecheck are clean.

## Suggested next moves

1. Rewrite the README to match the actual exported API.
2. Decide whether the package is OpenAPI-generated, well-known-config-driven, or intentionally hybrid, then document that decision.
3. Add a package-local test script and a simple client-flow diagram.
