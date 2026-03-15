# Critique: `packages/schemas` (`@ucdjs/schemas`)

## Validation

- `pnpm --dir packages/schemas run typecheck` -> passed
- `pnpm --dir packages/schemas run build` -> passed
- package-local `test` script -> none

## Findings

- The package is central to API and storage contracts, but the README in [packages/schemas/README.md](/Users/luxass/dev/ucdjs/ucd/packages/schemas/README.md) is almost empty. That is valid criticism because this package is supposed to define shared truth.
- The package currently mixes several domains in one place: API config, filesystem entries, lockfiles, manifests, and Unicode version/tree schemas in [packages/schemas/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/index.ts). That works, but it is becoming a kitchen-sink schema package.
- The comments in [packages/schemas/src/unicode.ts](/Users/luxass/dev/ucdjs/ucd/packages/schemas/src/unicode.ts) show schema design being influenced by tool limitations, not just domain modeling. That is understandable, but it should be documented as a tradeoff.
- The package has tests under [packages/schemas/test](/Users/luxass/dev/ucdjs/ucd/packages/schemas/test), but there is still no package-local `test` script.
- A diagram mapping which packages consume which schema families would immediately improve maintainability.

## What is good

- Build and typecheck are clean.
- The package is one of the few places where cross-package contracts are at least centralized.

## Suggested next moves

1. Document schema families and ownership instead of presenting one undifferentiated package.
2. Explain tool-driven compromises like recursive schema handling.
3. Add package-local test execution and a schema-consumer diagram.
