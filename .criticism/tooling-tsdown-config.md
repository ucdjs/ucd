# Critique: `tooling/tsdown-config` (`@ucdjs-tooling/tsdown-config`)

## Validation

- `pnpm --dir tooling/tsdown-config run typecheck` -> passed
- package-local `build` script -> none
- package-local `test` script -> none

## Findings

- The package is tiny but high leverage, yet it has no tests. [tooling/tsdown-config/src/factory.ts](/Users/luxass/dev/ucdjs/ucd/tooling/tsdown-config/src/factory.ts) effectively codifies how most published packages build.
- The factory in [tooling/tsdown-config/src/factory.ts](/Users/luxass/dev/ucdjs/ucd/tooling/tsdown-config/src/factory.ts) hardcodes `./src/index.ts` and `./tsconfig.build.json`. That is convenient, but it also means packages are shaped around the tool’s assumptions instead of the tool adapting cleanly to package differences.
- The README in [tooling/tsdown-config/README.md](/Users/luxass/dev/ucdjs/ucd/tooling/tsdown-config/README.md) explains usage but not the repo conventions embedded in the defaults.
- A build-pipeline diagram would help contributors understand how tsdown-config, tsconfig, and per-package `tsdown.config.ts` files interact.

## What is good

- Typecheck passes.
- The package centralizes repeated build defaults, which is valuable in a monorepo this size.

## Suggested next moves

1. Add fixture tests that prove the defaults work across a few package shapes.
2. Document the assumptions built into the factory.
3. Add a diagram of the shared package build path.
