# Critique: `packages/pipelines/pipeline-server` (`@ucdjs/pipelines-server`)

## Validation

- `pnpm --dir packages/pipelines/pipeline-server run typecheck` -> passed
- `pnpm --dir packages/pipelines/pipeline-server run build` -> passed

## Findings

- Your libSQL concern is valid. [packages/pipelines/pipeline-server/package.json](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-server/package.json) pulls in `@libsql/client`, `drizzle-orm`, `drizzle-kit`, and a large frontend/server stack for one package. That is a lot of dependency weight for a package that defaults to a local file DB in [packages/pipelines/pipeline-server/src/server/db/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-server/src/server/db/index.ts).
- The package has no README. That is a real problem because it is one of the largest packages in the repo and it mixes server API, client UI, database, workspace detection, and pipeline execution wiring.
- The server starts by auto-running migrations in [packages/pipelines/pipeline-server/src/server/app.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-server/src/server/app.ts). That may be fine for a dev tool, but it is a strong operational opinion that deserves documentation.
- Development defaults are muddled. In development, [packages/pipelines/pipeline-server/src/server/app.ts](/Users/luxass/dev/ucdjs/ucd/packages/pipelines/pipeline-server/src/server/app.ts) falls back to `pipeline-playground` plus a GitHub remote source. That makes the package feel more like a lab environment than a clearly bounded server product.
- This package needs architecture diagrams badly: UI/client, server, DB, workspace discovery, remote source loading, and executor integration.

## What is good

- Build and typecheck are clean.
- The package is ambitious and already centralizes a lot of pipeline tooling in one place.

## Suggested next moves

1. Re-evaluate the database stack and whether libSQL is justified for the current scope.
2. Document startup behavior, migrations, and source resolution explicitly.
3. Add diagrams for the server architecture.
