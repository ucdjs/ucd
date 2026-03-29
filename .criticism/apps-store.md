# Critique: `apps/store` (`@ucdjs/store`)

## Validation

- `pnpm --dir apps/store run typecheck` -> passed
- `pnpm --dir apps/store run build` -> worker bundle was produced, but Wrangler exited with sandbox-related `EPERM` while trying to write logs under `~/.config/.wrangler/logs`
- `pnpm exec vitest run --project=store` -> failed in this sandbox because the Cloudflare/Vitest worker test setup tried to write Wrangler logs and open a local listener on `127.0.0.1`

## Revised position

The earlier Store criticism was too broad.

Store already has a clear role in this repo as the public compatibility HTTP backend for the storage layer. The earlier high-severity criticism about placeholder snapshot metadata is no longer true, and the earlier validation criticism about missing consumer-facing proof is no longer true either:

- Store route tests cover the worker-local contract in [apps/store/test/routes](/Users/luxass/.codex/worktrees/a56c/ucd/apps/store/test/routes)
- generic HTTP backend behavior is already covered in [packages/fs-backend/test/http.test.ts](/Users/luxass/.codex/worktrees/a56c/ucd/packages/fs-backend/test/http.test.ts) and [packages/fs-backend/test/parity.test.ts](/Users/luxass/.codex/worktrees/a56c/ucd/packages/fs-backend/test/parity.test.ts)
- active `@ucdjs/ucd-store` HTTP integration coverage now exercises Store-style file access in [packages/ucd-store/test/integration/http/files.test.ts](/Users/luxass/.codex/worktrees/a56c/ucd/packages/ucd-store/test/integration/http/files.test.ts)

That means the main remaining criticism is much smaller: some service metadata is still hand-maintained and could drift from the app's real state.

## Findings

### 1. Service metadata and root messaging are still partly hand-maintained

Severity: low

Evidence:

- The root route in [apps/store/src/worker.ts](/Users/luxass/.codex/worktrees/a56c/ucd/apps/store/src/worker.ts) still hardcodes `version: "1.0.0"`.

Why this is valid criticism:

- This is no longer a boundary or correctness problem, but it is still a small source of drift in the public service metadata.
- The app contract is now clearer than before, so the remaining weak point is mostly that the root response is maintained by hand.

What to do:

- Source the service version from one place instead of hardcoding it in the worker response.
- Keep the root response minimal, but make sure it reflects the real service metadata.

## What is good

- Store has a clear role as the storage-facing HTTP compatibility boundary.
- Snapshot and lockfile metadata are now part of the real contract instead of placeholders.
- Store route tests and consumer-facing integration coverage now complement each other instead of leaving the Store boundary unproven.
- The route surface is still small, which keeps the app easy to reason about.

## Recommended path forward

1. Remove the hardcoded root service version.
2. Keep Store route tests and `@ucdjs/ucd-store` HTTP integration tests aligned as the compatibility contract evolves.
3. Drop this criticism file entirely once the hand-maintained root metadata is cleaned up.
