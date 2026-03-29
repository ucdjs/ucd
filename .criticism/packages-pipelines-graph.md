# Critique: `packages/pipelines/pipeline-graph` (`@ucdjs/pipelines-graph`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-graph run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-graph run build` -> passed

## Findings

- The package is extremely thin. [packages/pipelines/pipeline-graph/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-graph/src/index.ts) exports a small graph builder and helpers, but the README in [packages/pipelines/pipeline-graph/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-graph/README.md) does not explain why this is a separate package rather than part of core or server.
- The absence of diagrams hurts here too. A graph package with no graph examples or visuals is making users read source for something that should be immediately visual.

## What is good

- Build and typecheck are clean.
- The package at least keeps graph-specific helpers out of pipeline-core.

## Suggested next moves

1. Justify the package boundary with real docs and graph examples.
2. Add actual graph diagrams and screenshots where this package is documented.
