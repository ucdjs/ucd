# Critique: `packages/lockfile` (`@ucdjs/lockfile`)

## Validation

- `pnpm --dir packages/lockfile run typecheck` -> passed
- `pnpm --dir packages/lockfile run build` -> passed
- package-local `test` script -> none

## Findings

- This is one of the healthier packages structurally, but the docs are still drifting. [packages/lockfile/README.md](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/README.md) fetches examples from `https://ucdjs.dev/...`, while the actual Store boundary in this repo is `ucd-store.ucdjs.dev`.
- The hashing layer still advertises unfinished intent. [packages/lockfile/src/hash.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/hash.ts) starts with a TODO about being replaced later by a “proper unicode library”.
- The package has tests under [packages/lockfile/test](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/test), but no package-local `test` script, and several TODO comments remain in those tests.
- The relationship between lockfiles, snapshots, Store API responses, and `ucd-store` state is still not diagrammed anywhere, which makes a focused package feel more coupled than it needs to.

## What is good

- The package boundary is much clearer than many others in the repo.
- Build and typecheck are clean.

## Suggested next moves

1. Fix the README examples so they point at the real current endpoints.
2. Decide whether the hashing TODO is a real roadmap item or dead commentary.
3. Add a small lifecycle diagram for lockfile <-> snapshot <-> store interactions.
