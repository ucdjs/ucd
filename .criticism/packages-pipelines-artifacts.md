# Critique: `packages/pipelines/pipeline-artifacts` (`@ucdjs/pipelines-artifacts`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-artifacts run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-artifacts run build` -> passed
- package-local `test` script -> none

## Findings

- The README in [packages/pipelines/pipeline-artifacts/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-artifacts/README.md) is generic template text and does not explain what artifacts are or why they live in a separate package from core.
- The package boundary is very small. [packages/pipelines/pipeline-artifacts/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-artifacts/src/index.ts) mostly exports definition/schema helpers. That is valid criticism because the cost of another package boundary needs stronger justification than “some artifact helpers exist”.
- The package has tests under [packages/pipelines/pipeline-artifacts/test](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-artifacts/test), but no package-local `test` script, which keeps undermining pipeline DX.
- A diagram showing core -> artifacts -> executor responsibilities would make this package much easier to justify and maintain.

## What is good

- Build and typecheck are clean.
- The boundary is still small enough to rethink cheaply.

## Suggested next moves

1. Either justify the package boundary with real docs or fold the concern closer to core.
2. Add package-local tests and artifact lifecycle documentation.
3. Add a pipeline package relationship diagram.
