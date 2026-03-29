# Critique: `packages/pipelines/pipeline-playground` (`@ucdjs/pipelines-playground`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-playground run typecheck` -> passed
- package-local `build` script -> none

## Findings

- This package is a playground, but it is carrying too much normative weight. [packages/pipelines/pipeline-server/src/server/app.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-server/src/server/app.ts) defaults to `pipeline-playground` in development, which means the example package is also part of the real workflow story.
- The source in [packages/pipelines/pipeline-playground/src/advanced.ucd-pipeline.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-playground/src/advanced.ucd-pipeline.ts) contains the exact casts and `@ts-expect-error` markers that demonstrate pipeline type friction. That is valid criticism even for a playground, because this repo is implicitly using it as a reference.
- There is no README and no tests. For a package that doubles as the default demo/dev source, that is weak ownership.
- A diagram showing “example package” versus “production package” responsibilities would help prevent this package from quietly becoming part of the platform contract.

## What is good

- It does provide a concrete place to experiment with pipeline definitions.
- Typecheck passes, which at least keeps the examples roughly current.

## Suggested next moves

1. Decide whether this is a demo fixture or a supported reference package.
2. Remove cast-heavy examples once core types are improved.
3. Add minimal docs and a diagram showing how the playground is supposed to be used.
