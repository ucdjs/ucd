# Critique: `packages/ucd-store` (`@ucdjs/ucd-store`)

## Validation

- `pnpm --dir packages/ucd-store run typecheck` -> passed
- `pnpm --dir packages/ucd-store run build` -> passed
- `pnpm exec vitest run --project=ucd-store` -> 13 files passed, 3 skipped, 24 todo

This package is not failing locally. The criticism is that it is carrying too much architectural weight and pushing storage-layer complexity upward instead of containing it.

## Scores

- Consumer DX: `3/10`
- Boundary clarity: `2/10`
- Documentation accuracy: `2/10`
- Storage abstraction quality: `3/10`
- Runtime/test confidence: `6/10`

## Findings

### 1. `ucd-store` is trying to be the entire storage subsystem, not a focused package

Severity: high

Evidence:

- The main factory in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L37) resolves API endpoints, creates a client, resolves bridge options, detects lockfile capability, validates versions, initializes lockfiles, handles version conflicts, verifies store state, and binds file/report/task operations.
- The public exports cover file access, mirroring, syncing, analyzing, comparing, version validation, and multiple factory entry points in [packages/ucd-store/src/index.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/index.ts#L1).

Why this is valid criticism:

- This package is no longer just a store abstraction.
- It is acting as a storage orchestrator, API bootstrapper, local-state manager, reporting engine, and sync engine all at once.
- That is the core reason the `ucd-store`/Store API/`fs-bridge` area feels messy: the responsibilities are not layered cleanly.

Recommendation:

- Split the package mentally and eventually physically into clearer layers:
- store construction and context
- file access
- mirroring/sync
- reporting
- local lockfile/state management

### 2. The abstraction leaks `fs-bridge` complexity straight into the consumer API

Severity: high

Evidence:

- `UCDStoreOptions` requires consumers to understand `FileSystemBridgeFactory`, `FileSystemBridgeArgs`, discovery-time bridge options, and writable vs read-only behavior in [packages/ucd-store/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/types.ts#L40).
- `createUCDStore` contains `@ts-expect-error` calls around invoking the bridge factory because the abstraction is too awkward for the type system in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L88).
- The convenience factories still just forward into that same complexity in [packages/ucd-store/src/factory.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/factory.ts#L19).

Why this is valid criticism:

- A storage package should absorb bridge complexity, not expose most of it to consumers.
- Right now the supposed abstraction boundary is upside down: consumers still need to think about internal bridge mechanics and store bootstrap rules.
- This is one of the strongest signs that `ucd-store` and `fs-bridge` are too entangled.

Recommendation:

- Make the default consumer path much narrower.
- Push the generic bridge factory API behind advanced/internal entry points.
- Give public consumers simpler presets with fewer branching behaviors.

### 3. The package mixes local-state policy with data access policy

Severity: high

Evidence:

- `createUCDStore` decides lockfile support from bridge capabilities, checks for existing lockfiles, initializes lockfiles, and applies version conflict strategies in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L96).
- It also decides read-only vs writable semantics and verification behavior in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L181).

Why this is valid criticism:

- A consumer trying to “open a store” is actually triggering a lot of hidden local-state policy.
- That makes the constructor too magical and too hard to reason about.
- It also explains why Store API and CLI behavior can feel surprising: store creation is doing more than it says on the tin.

Recommendation:

- Separate “attach to storage” from “initialize/repair local state”.
- Make lockfile/version policy an explicit phase or helper, not always part of construction.

### 4. The public surface is overloaded and hard to understand quickly

Severity: medium

Evidence:

- The public type surface is very broad in [packages/ucd-store/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/types.ts#L56).
- The file operations use dual invocation forms with `this` binding and overload shims in [packages/ucd-store/src/files/get.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/get.ts#L126), [packages/ucd-store/src/files/list.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/list.ts#L158), and [packages/ucd-store/src/files/tree.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/tree.ts#L125).

Why this is valid criticism:

- The package already has high conceptual load, and the API shape adds more.
- Overloaded “call with context or bind with this” helpers are clever, but they make the code harder to own and explain.
- This is exactly the kind of design that feels convenient locally while making the subsystem harder to simplify later.

Recommendation:

- Prefer explicit functions or class/object methods over dual invocation patterns.
- Reduce the number of concepts a consumer needs to learn before doing basic file operations.

### 5. The docs badly under-describe one of the most complicated packages in the repo

Severity: medium

Evidence:

- The package README is almost empty in [packages/ucd-store/README.md](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/README.md#L1).
- The docs page says API docs will be added “as the package stabilizes” in [apps/docs/content/architecture/ucd-store.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/architecture/ucd-store.mdx#L34).
- The same docs page describes the package as a simple bridge-supporting store in [apps/docs/content/architecture/ucd-store.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/architecture/ucd-store.mdx#L26), which materially understates the real behavior.

Why this is valid criticism:

- This is not a package that can get away with vague docs.
- It is one of the highest-complexity packages in the repo, yet its docs are among the thinnest.
- That gap guarantees that maintainers and consumers will reverse-engineer behavior from source.

Recommendation:

- Document the actual lifecycle:
- create store
- resolve versions
- resolve bridge mode
- resolve lockfile policy
- run file/sync/report operations

### 6. The package is too tightly coupled to `client`, `lockfile`, and `fs-bridge`

Severity: medium

Evidence:

- Runtime dependencies include `@ucdjs/client`, `@ucdjs/fs-bridge`, `@ucdjs/lockfile`, `@ucdjs/env`, and `@ucdjs-internal/shared` in [packages/ucd-store/package.json](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/package.json#L39).
- The core constructor immediately wires together API config, client behavior, bridge behavior, and lockfile behavior in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L41).

Why this is valid criticism:

- Some dependency coupling is expected here, but the package currently looks like the convergence point for too many subsystems.
- That makes it hard to evolve any one of those subsystems independently.
- It also means bugs in the storage layer are more likely to show up as cross-package behavior problems.

Recommendation:

- Reduce orchestration logic in `ucd-store` and let narrower helpers own more of the policy.
- Revisit whether `ucd-store` should depend on full `client` behavior by default.

### 7. Typing friction is already visible in the public API design

Severity: medium

Evidence:

- The package documents unresolved typing issues for `fsOptions` in [packages/ucd-store/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/types.ts#L91).
- The implementation needs `@ts-expect-error` around bridge factory invocation in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts#L91).

Why this is valid criticism:

- This is not just a TypeScript annoyance. It is feedback that the abstraction is too flexible for its own good.
- The same repo-wide problem you mentioned for pipelines appears here too: difficult APIs are being patched over with casts and escape hatches instead of simplified.

Recommendation:

- Simplify the bridge-construction contract.
- Prefer fewer supported shapes over a generic API that the type system and maintainers both struggle with.

### 8. Test coverage is decent, but it still signals unfinished behavior

Severity: medium

Evidence:

- `vitest` for `ucd-store` passed, but there are `3 skipped` files and `24 todo` tests in the current project run.
- The package has many tests, which is good, but the unfinished markers matter because this package sits at the center of a messy subsystem.

Why this is valid criticism:

- This package is a high-leverage dependency.
- “Mostly tested” is not the same as “operationally clear,” especially when the constructor and sync flows are policy-heavy.

Recommendation:

- Prioritize closing skipped/todo coverage in the store bootstrap, sync, and bridge-interaction paths.

### 9. The package is missing diagrams, and this is one of the places where that hurts the most

Severity: medium

Evidence:

- There is no diagram showing the relationship between `ucd-store`, `fs-bridge`, `lockfile`, `client`, Store API, and writable vs read-only modes.
- The current docs provide only light prose for a package with multiple operational modes.

Why this is valid criticism:

- This subsystem is already hard to hold in your head.
- A diagram would reduce ambiguity immediately, especially around:
- node bridge vs http bridge
- lockfile-supported vs read-only stores
- API fallback vs local reads
- who owns syncing and mirroring

Recommendation:

- Add at least two diagrams:
- package relationship diagram for `ucd-store` / `fs-bridge` / `lockfile` / `client`
- lifecycle diagram for store creation in writable and read-only modes

## What is good

- The package has substantial test coverage compared to much of the repo.
- It builds and typechecks cleanly.
- The convenience factories for Node and HTTP are useful, even if they currently hide a lot of complexity beneath them.

## Suggested next moves

1. Stop treating `ucd-store` as the place where every storage concern converges.
2. Narrow the public store-construction API so bridge and lockfile complexity stops leaking upward.
3. Document the real lifecycle and modes instead of describing it as a simple store.
4. Add diagrams for writable/read-only flow and package relationships.
5. Review `apps/store` and `@ucdjs/fs-bridge` next, because the mess is clearly shared across those boundaries.
