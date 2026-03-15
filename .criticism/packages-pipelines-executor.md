# Critique: `packages/pipelines/pipeline-executor` (`@ucdjs/pipelines-executor`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-executor run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-executor run build` -> passed
- package-local `test` script -> none

## Findings

- This package is doing more than “execution.” The Node runtime in [packages/pipelines/pipeline-executor/src/runtime/node.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/src/runtime/node.ts) monkey-patches global console and stdio to capture logs. That is valid criticism because it makes execution behavior invasive and harder to reason about.
- The README in [packages/pipelines/pipeline-executor/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/README.md) is better than the rest of the pipeline docs, but it still undersells the side effects and host responsibilities.
- The package has tests under [packages/pipelines/pipeline-executor/test](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/test), but there is no package-local `test` script.
- This package needs a runtime diagram: pipeline-core model -> executor -> runtime adapter -> host log persistence.

## What is good

- The package at least has a sharper value proposition than several neighboring pipeline packages.
- Build and typecheck are clean.

## Suggested next moves

1. Document the global-output capture behavior as a first-class tradeoff.
2. Add package-local tests and isolate runtime side effects more clearly.
3. Add a runtime ownership diagram.
