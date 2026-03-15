# Critique: `packages/test-utils` (`@ucdjs/test-utils`)

## Validation

- `pnpm --dir packages/test-utils run typecheck` -> passed
- `pnpm --dir packages/test-utils run build` -> passed
- package-local `test` script -> none

## Findings

- This package should be one of the answers to your testing DX complaint, but it is under-documented. [packages/test-utils/README.md](/Users/luxass/dev/ucdjs/ucd/packages/test-utils/README.md) barely explains the exported matchers, MSW helpers, and mock-store facilities.
- The package has become a large grab-bag. [packages/test-utils/package.json](/Users/luxass/dev/ucdjs/ucd/packages/test-utils/package.json) and [packages/test-utils/src](/Users/luxass/dev/ucdjs/ucd/packages/test-utils/src) cover schema matchers, MSW setup, fs-bridge helpers, mock store behavior, and pipeline helpers all in one place.
- Several helpers still rely on casts and permissive shapes in [packages/test-utils/src/mock-store](/Users/luxass/dev/ucdjs/ucd/packages/test-utils/src/mock-store), which is exactly the kind of testing looseness you said you want to tighten.
- The package has a healthy test tree under [packages/test-utils/test](/Users/luxass/dev/ucdjs/ucd/packages/test-utils/test), but no package-local `test` script, so even the testing package contributes to repo-wide testing inconsistency.
- This package needs diagrams too: what should consumers use for HTTP mocking, schema assertions, store mocking, and pipeline tests.

## What is good

- The package is trying to centralize test helpers instead of duplicating them everywhere.
- Build and typecheck are clean.

## Suggested next moves

1. Break the package into documented testing lanes instead of one broad toolbox.
2. Tighten helper typings so tests stop depending on loose casts and ad hoc source access.
3. Add usage docs and a testing decision diagram.
