# Critique: `tooling/moonbeam` (`@ucdjs/moonbeam`)

## Validation

- package-local `typecheck` script -> none
- package-local `build` script -> none
- package-local `test` script -> none

## Findings

- This package is operationally important, but it has almost no safety net. [tooling/moonbeam/README.md](/Users/luxass/dev/ucdjs/ucd/tooling/moonbeam/README.md) explains why it exists, yet the package has no tests and no typecheck script.
- Moonbeam is compensating for workspace resolution weaknesses by inserting a custom loader into development scripts. That is valid criticism because it means core monorepo ergonomics depend on a bespoke workaround.
- If this loader mis-resolves packages, the failure mode will be confusing and cross-cutting. That risk is not matched by the current verification story.
- A module-resolution diagram would help contributors understand where Moonbeam sits relative to tsconfig paths, workspace packages, and built artifacts.

## What is good

- The README is clearer than most internal tooling READMEs.
- The package is small and narrowly scoped.

## Suggested next moves

1. Add tests around workspace detection and subpath resolution.
2. Add a typecheck path or a stricter validation step.
3. Document where Moonbeam is required versus where it should be avoided.
