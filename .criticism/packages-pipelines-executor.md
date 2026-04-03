# Critique: `packages/pipelines/pipeline-executor` (`@ucdjs/pipeline-executor`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-executor run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-executor run build` -> passed

## Findings

- This package is doing more than “execution.” The Node runtime in [packages/pipelines/pipeline-executor/src/runtime/node.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/src/runtime/node.ts) monkey-patches global console and stdio to capture logs. That is valid criticism because it makes execution behavior invasive and harder to reason about.
- The source layer in [packages/pipelines/pipeline-executor/src/executor/source-adapter.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/src/executor/source-adapter.ts) and `SourceBackend` in [packages/pipelines/pipeline-core/src/source.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-core/src/source.ts) are now transitional abstractions if the repo is moving toward a shared `fs-backend` package.
- The README in [packages/pipelines/pipeline-executor/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-executor/README.md) is better than the rest of the pipeline docs, but it still undersells the side effects and host responsibilities.
- This package needs a runtime diagram: pipeline-core model -> executor -> runtime adapter -> host log persistence.

## Additional architecture note

- If the repo is moving toward a shared `fs-backend` package, this package is part of that migration story.
- The current `SourceBackend` / `createSourceAdapter()` model should be treated as transitional, not as the long-term abstraction to preserve.
- The intended direction is to replace those pipeline-specific types and helper functions with shared backend types and functions from `fs-backend`.
- That means future work here should focus less on preserving `SourceBackend` and more on making the executor consume the shared backend contract cleanly.

## What is good

- The package at least has a sharper value proposition than several neighboring pipeline packages.
- Build and typecheck are clean.

## Suggested next moves

1. Document the global-output capture behavior as a first-class tradeoff.
2. Plan to replace `SourceBackend` / `createSourceAdapter()` with shared backend types and functions from the future `fs-backend` package.
3. Isolate runtime side effects more clearly.
4. Add a runtime ownership diagram.
