# Critique: `packages/fs-bridge` (`@ucdjs/fs-bridge`)

## Validation

- `pnpm --dir packages/fs-bridge run typecheck` -> passed
- `pnpm --dir packages/fs-bridge run build` -> passed
- package-local `test` script -> none

## Findings

- This package is one of the roots of the storage mess. The abstraction in [packages/fs-bridge/src/define.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/define.ts) is flexible, but flexible enough that `ucd-store` has to leak bridge mechanics upward instead of simply consuming a stable interface.
- The HTTP bridge in [packages/fs-bridge/src/bridges/http.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/bridges/http.ts) turns recursive directory listing into repeated self-fetching. That is valid criticism because it bakes an N+1-style traversal pattern into a public bridge implementation.
- The package still has type-escape pressure at important points, for example symbol attachment and wrapped operation invocation in [packages/fs-bridge/src/define.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/define.ts) and `src/utils.ts`.
- The README in [packages/fs-bridge/README.md](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/README.md) explains the happy path, but not capability inference, optional operations, hooks, or how this package is supposed to relate to `ucd-store`.
- The package has a solid test tree under [packages/fs-bridge/test](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/test), but no package-local `test` script. That is a tooling quality issue, not just style.
- This package badly needs diagrams: bridge factory lifecycle, optional capability inference, and how HTTP/Node bridges feed into `ucd-store`.

## What is good

- It builds and typechecks cleanly.
- The test surface is broader than most packages in the repo.

## Suggested next moves

1. Narrow the public abstraction so consumers stop needing to understand bridge internals.
2. Revisit the recursive HTTP listing strategy before it becomes a performance contract.
3. Add diagrams and package-local test execution so this subsystem stops being source-only knowledge.
