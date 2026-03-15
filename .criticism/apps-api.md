# Critique: `apps/api` (`@ucdjs/api`)

## Validation

- `pnpm --dir apps/api run typecheck` -> passed
- `pnpm --dir apps/api run build` -> passed
- `pnpm --dir apps/api run test` -> failed in this sandbox because the worker test setup tried to open a local listener on `127.0.0.1`

## Findings

- The API worker is carrying too many roles at once. [apps/api/src/worker.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/worker.ts) serves the HTTP API, OpenAPI document, task upload routes, well-known routes, and the workflow entrypoint, while [apps/api/src/index.ts](/Users/luxass/dev/ucdjs/ucd/apps/api/src/index.ts) also exposes a service-binding RPC method for file access. That is valid criticism because this worker is both public API and internal infrastructure boundary.
- The dev workflow is still API-special-cased. `dev:setup` in [apps/api/package.json](/Users/luxass/dev/ucdjs/ucd/apps/api/package.json) is the thing the rest of the repo leans on, which is exactly why Store and the worker story feel uneven.
- Testing confidence is lower than the green build suggests. The package has tests, but the package-local test path depends on worker networking and fails under constrained environments. That means contributors do not get a clean, isolated validation path.
- The README in [apps/api/README.md](/Users/luxass/dev/ucdjs/ucd/apps/api/README.md) is mostly operational boilerplate. It does not explain the route ownership split between API, Store compatibility routes, tasks, and workflows.
- This subsystem needs diagrams. There is no sequence diagram for upload task -> workflow -> R2 -> cache purge, and no boundary diagram showing API versus Store versus worker-utils.

## What is good

- The app builds and typechecks cleanly.
- OpenAPI is wired into the runtime, so the HTTP contract is at least formalized.

## Suggested next moves

1. Split public API concerns from workflow/service-binding concerns more aggressively.
2. Give the worker apps a shared dev lifecycle instead of making API the special case everything else depends on.
3. Add diagrams for the task/workflow flow and the API/Store ownership split.
