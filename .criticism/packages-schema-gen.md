# Critique: `packages/schema-gen` (`@ucdjs/schema-gen`)

## Validation

- `pnpm --dir packages/schema-gen run typecheck` -> passed
- `pnpm --dir packages/schema-gen run build` -> passed
- package-local `test` script -> none

## Findings

- The README in [packages/schema-gen/README.md](/Users/luxass/dev/ucdjs/ucd/packages/schema-gen/README.md) is wrong by omission. It says “Utilities for working with the Unicode Character Database,” while the package is specifically doing AI-assisted schema field generation in [packages/schema-gen/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/schema-gen/src/index.ts).
- The package has a fragile dependency posture. [packages/schema-gen/package.json](/Users/luxass/dev/ucdjs/ucd/packages/schema-gen/package.json) depends on `ai`, `@ai-sdk/openai`, and `@luxass/unicode-utils-old`, while the source still contains temporary workarounds and TODOs around model/tooling compatibility.
- Error handling is mostly console logging and null-skipping in [packages/schema-gen/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/schema-gen/src/index.ts). That may be acceptable for an internal tool, but it is not a strong library contract.
- The package has tests under [packages/schema-gen/test](/Users/luxass/dev/ucdjs/ucd/packages/schema-gen/test), but again no package-local `test` script.
- This package needs a flow diagram more than marketing text: raw file -> field generation -> schema code -> consumer package.

## What is good

- The implementation is small enough to rework without major migration pain.
- Build and typecheck are clean.

## Suggested next moves

1. Rewrite the README around what the package actually does.
2. Make error reporting structured instead of mostly console-driven.
3. Document the AI-assisted generation pipeline with a diagram and real caveats.
