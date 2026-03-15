# Critique: `packages/worker-utils` (`@ucdjs-internal/worker-utils`)

## Validation

- `pnpm --dir packages/worker-utils run typecheck` -> passed
- `pnpm --dir packages/worker-utils run build` -> passed
- package-local `test` script -> none

## Findings

- This package is effectively your worker framework layer, but it has no README. Consumers are expected to learn error helpers, strict handlers, task helpers, hostnames, and setup functions directly from [packages/worker-utils/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/worker-utils/src/index.ts).
- The error helpers in [packages/worker-utils/src/errors.ts](/Users/luxass/dev/ucdjs/ucd/packages/worker-utils/src/errors.ts) repeatedly end in `as any`. That is valid criticism because this package exists to standardize worker behavior, including error responses.
- The CORS setup in [packages/worker-utils/src/setups/cors.ts](/Users/luxass/dev/ucdjs/ucd/packages/worker-utils/src/setups/cors.ts) quietly defaults based on environment strings. That may be practical, but it should be documented because both API and Store rely on it.
- The package has tests under [packages/worker-utils/test](/Users/luxass/dev/ucdjs/ucd/packages/worker-utils/test), but no package-local `test` script.
- A worker-boundary diagram would help here more than almost anywhere else: shared handlers, environment resolution, tasks, and app integration points.

## What is good

- Centralizing worker helpers is the right instinct.
- Build and typecheck are clean.

## Suggested next moves

1. Document the package as a framework layer, not a miscellaneous helper bucket.
2. Remove the repeated `as any` escapes from the standardized error path.
3. Add package-local tests and a worker setup/ownership diagram.
