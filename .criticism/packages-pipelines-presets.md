# Critique: `packages/pipelines/pipeline-presets` (`@ucdjs/pipelines-presets`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-presets run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-presets run build` -> passed
- package-local `test` script -> none

## Findings

- There is no README. For a package exporting the most reusable high-level pipeline helpers in [packages/pipelines/pipeline-presets/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-presets/src/index.ts), that is a documentation failure.
- The package is supposed to make pipeline authoring easier, but there is no guide showing when to use a preset parser/resolver versus writing one directly against core.
- Test coverage is very light relative to surface area: one test file under [packages/pipelines/pipeline-presets/test](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-presets/test), and no package-local `test` script.
- This package especially needs diagrams and examples, because “preset” is only valuable if the opinionated path is visible and understandable.

## What is good

- Build and typecheck are clean.
- The package is the right place to hide common UCD-specific pipeline patterns.

## Suggested next moves

1. Add documentation and examples for the preset building blocks.
2. Expand tests around the main preset pipelines and parsers.
3. Add a diagram that separates core primitives from opinionated presets.
