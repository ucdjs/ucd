# Critique: `packages/pipelines/pipeline-core` (`@ucdjs/pipelines-core`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-core run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-core run build` -> passed
- package-local `test` script -> none

## Findings

- This is the center of the pipeline type mess you called out. The export surface in [packages/pipelines/pipeline-core/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-core/src/index.ts) is huge, and the API is generic enough that downstream examples in [packages/pipelines/pipeline-playground/src/advanced.ucd-pipeline.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-playground/src/advanced.ucd-pipeline.ts) resort to `as unknown as` casts for route dependencies.
- The README in [packages/pipelines/pipeline-core/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-core/README.md) is generic and does not document the DSL, dependency model, or runtime expectations. That is a real defect for the most conceptually dense pipeline package.
- The package has tests under [packages/pipelines/pipeline-core/test](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-core/test), but again no package-local `test` script.
- This package desperately needs diagrams: pipeline definition anatomy, route dependency graph, artifact flow, and runtime handoff to the executor.

## What is good

- Build and typecheck are clean.
- The package is clearly the right place to centralize the pipeline model, even if the current API is too hard to hold in your head.

## Suggested next moves

1. Reduce generic flexibility until common pipeline definitions stop needing casts.
2. Write real documentation for the DSL instead of template text.
3. Add diagrams for route dependencies and execution flow.
