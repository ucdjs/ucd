# Critique: `packages/ucdjs-scripts` (`@ucdjs/ucdjs-scripts`)

## Validation

- `pnpm --dir packages/ucdjs-scripts run typecheck` -> passed
- `pnpm --dir packages/ucdjs-scripts run build` -> passed
- `pnpm exec turbo run typecheck --filter=@ucdjs/ucdjs-scripts` -> pulled in `@ucdjs/api#build:openapi` and failed in this sandbox with `tsx` IPC socket `EPERM`
- `pnpm exec turbo run build --filter=@ucdjs/ucdjs-scripts` -> same unrelated `@ucdjs/api#build:openapi` failure path

The package itself builds. The criticism is about orchestration design, workflow ownership, and how dev setup is modeled across the monorepo.

Review context update:

- In this repo, published `@ucdjs-internal/*` packages are intentional and are not being treated here as a defect by themselves.
- The criticism below stays focused on the workflow/tooling layer and on the messy `ucd-store`/Store API/fs-bridge area you called out, because this package is part of the coordination story around that mess.

## Scores

- Dev setup design: `3/10`
- Workflow ergonomics: `4/10`
- Reusability: `2/10`
- Documentation accuracy: `3/10`
- Validation clarity: `4/10`

## Findings

### 1. `setup-dev` is presented as shared tooling, but it is hardcoded to one app

Severity: high

Evidence:

- The CLI advertises `setup-dev` as a general command in [packages/ucdjs-scripts/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/index.ts#L10).
- The implementation hardcodes `apps/api` as the worker root in [packages/ucdjs-scripts/src/commands/setup-dev.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/commands/setup-dev.ts#L21).
- It starts the API worker directly with `unstable_startWorker` in [packages/ucdjs-scripts/src/commands/setup-dev.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/commands/setup-dev.ts#L27).
- The upload target is hardcoded to `http://127.0.0.1:8787` in [packages/ucdjs-scripts/src/commands/setup-dev.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/commands/setup-dev.ts#L91).

Why this is valid criticism:

- This is the core reason the dev setup feels ugly. The package is not modeling an environment, it is scripting one special case.
- The moment Store or another worker needs equivalent setup behavior, this design stops scaling.
- It also means the “workflow” is not reusable infrastructure. It is an API-specific bootstrap hidden inside a shared package.

Recommendation:

- Model dev setup around targets or environments, not one hardcoded app.
- `setup-dev` should accept an explicit target, config path, and base URL, or delegate to per-app adapters.

### 2. The option model is too weak for the problem it is trying to solve

Severity: high

Evidence:

- `SetupDevOptions` only supports `versions` and `batchSize` in [packages/ucdjs-scripts/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/types.ts#L16).
- By contrast, `refresh-manifests` supports environment and base URL resolution in [packages/ucdjs-scripts/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/index.ts#L21) and [packages/ucdjs-scripts/src/lib/config.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/lib/config.ts#L30).

Why this is valid criticism:

- Your shared tooling has two commands with very different maturity levels.
- The remote-oriented command has a real configuration model. The local dev command is basically hardcoded.
- That asymmetry is a design smell: local development is treated as a hack, not as a first-class workflow.

Recommendation:

- Bring `setup-dev` onto the same config model as `refresh-manifests`.
- Add support for target app, base URL, worker config path, and maybe “seed only” vs “start+seed”.

### 3. The package duplicates workflow orchestration instead of abstracting it

Severity: medium

Evidence:

- `setup-dev` and `refresh-manifests` both generate manifests, upload tar payloads, wait for workflow completion, and aggregate result state in [packages/ucdjs-scripts/src/commands/setup-dev.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/commands/setup-dev.ts#L33) and [packages/ucdjs-scripts/src/commands/refresh-manifests.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucdjs-scripts/src/commands/refresh-manifests.ts#L20).

Why this is valid criticism:

- You already have enough complexity that duplication hurts.
- The package should be the place where these flows become cleaner and more composable, but instead it repeats orchestration logic across commands.
- That increases the chance that local and remote workflows drift apart over time.

Recommendation:

- Extract a shared “manifest upload run” orchestration primitive.
- Keep command files thin and declarative.

### 4. The workflow layer is API-centric, not environment-centric

Severity: medium

Evidence:

- `apps/api` has a `dev:setup` script in [apps/api/package.json](/Users/luxass/dev/ucdjs/ucd/apps/api/package.json#L10).
- `apps/api/turbo.json` wires `dev` to depend on `dev:setup` in [apps/api/turbo.json](/Users/luxass/dev/ucdjs/ucd/apps/api/turbo.json#L8).
- `apps/store/turbo.json` has no equivalent setup task in [apps/store/turbo.json](/Users/luxass/dev/ucdjs/ucd/apps/store/turbo.json#L1).

Why this is valid criticism:

- This exactly matches your complaint that the worker setup only works for one app.
- The repo is not expressing a shared worker-development lifecycle. It is expressing one API-specific exception.
- As long as that remains true, “workflows” will keep feeling improvised.

Recommendation:

- Define a common worker dev lifecycle for API and Store.
- Then decide what is shared in tooling and what is app-specific.

### 5. Turbo/task validation is noisier than it should be for this package

Severity: medium

Evidence:

- Attempting `turbo run typecheck --filter=@ucdjs/ucdjs-scripts` and `turbo run build --filter=@ucdjs/ucdjs-scripts` pulled in `@ucdjs/api#build:openapi` and failed there instead of staying isolated.
- The development docs describe targeted package commands simply in [workflow.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/contributing/development/workflow.mdx#L55), but they do not prepare contributors for this kind of cross-package task behavior.

Why this is valid criticism:

- Even if the dependency graph is technically intentional, it is hostile to focused validation.
- When a tooling package cannot be checked cleanly without unrelated app side effects, contributor trust in the workflow drops.
- This is part of why the dev setup feels messy: scope is not obvious.

Recommendation:

- Re-evaluate why `ucdjs-scripts` validation touches `api` tasks in the filtered Turbo path.
- If that linkage is intentional, document it. If not, simplify the task graph.

### 6. The development docs are too generic for the actual workflow complexity

Severity: medium

Evidence:

- The development guide describes generic build/test commands in [workflow.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/contributing/development/workflow.mdx#L32).
- It does not explain the actual worker-specific local setup path, the manifest seeding flow, or the distinction between API and Store local development.

Why this is valid criticism:

- The repo has real worker-specific workflows now. The docs still read like a generic monorepo template.
- That gap forces contributors to discover operational knowledge by reading scripts and app configs.
- For a workflow-heavy codebase, that is poor DX.

Recommendation:

- Add a dedicated section for local worker development:
- what `dev:setup` does
- which app owns it today
- why Store differs
- how manifest seeding interacts with Cloudflare workflows and R2

### 7. The package has no tests for the workflow logic it owns

Severity: medium

Evidence:

- `packages/ucdjs-scripts` has no test files.
- Yet it owns config resolution, manifest generation orchestration, upload polling, and local worker bootstrapping.

Why this is valid criticism:

- This package is operational tooling. Regressions here are expensive because they block development workflows.
- The lack of tests is especially risky because the commands encode assumptions about environment topology and networking.

Recommendation:

- Add unit tests for config resolution and orchestration decisions.
- Mock upload/status operations and assert command behavior without requiring a live worker.

### 8. The package is missing diagrams for the dev workflow it is coordinating

Severity: medium

Evidence:

- There is no diagram showing the local dev flow from script -> worker boot -> tasks route -> workflow -> R2 -> cache purge.
- There is also no diagram showing where API and Store diverge in local development.

Why this is valid criticism:

- This package exists to coordinate multi-step workflows. A diagram is not optional fluff here; it is one of the fastest ways to explain the system.
- The current workflow complexity is high enough that prose alone is not carrying the model.

Recommendation:

- Add at least two diagrams:
- a local dev setup sequence diagram
- a package/app ownership diagram showing `ucdjs-scripts`, `apps/api`, `apps/store`, and workflow bindings

## What is good

- The package-local build and typecheck are clean.
- `refresh-manifests` is a more mature command and shows the direction the tooling should probably move toward.
- The package is still small enough that redesigning it would be cheaper now than later.

## Suggested next moves

1. Redesign `setup-dev` as target-based orchestration instead of an `apps/api` special case.
2. Give local and remote workflows a shared configuration model.
3. Define a common worker dev lifecycle for API and Store.
4. Add tests around config/orchestration logic.
5. Document the workflow with diagrams so contributors stop reverse-engineering it from source.
