# Critique: `packages/pipelines/pipeline-loader` (`@ucdjs/pipelines-loader`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-loader run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-loader run build` -> passed
- package-local `test` script -> none

## Findings

- The README in [packages/pipelines/pipeline-loader/README.md](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-loader/README.md) is still generic template text, even though this package is doing runtime bundling, importing from data URLs, remote locator materialization, and cache handling.
- The loader path in [packages/pipelines/pipeline-loader/src/loader.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-loader/src/loader.ts) depends on bundling arbitrary pipeline files and `import()`ing the generated data URL. That may be practical, but it makes debugging and trust boundaries harder than the package docs acknowledge.
- The package has tests under [packages/pipelines/pipeline-loader/test](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-loader/test), but no package-local `test` script.
- The package needs diagrams for local source discovery, remote source sync, bundle/import flow, and cache behavior.

## What is good

- Build and typecheck are clean.
- The package is at least attempting to keep loader concerns out of the executor.

## Suggested next moves

1. Document the bundling/import model honestly.
2. Add package-local tests and examples for local versus remote loading.
3. Add a loader flow diagram.
