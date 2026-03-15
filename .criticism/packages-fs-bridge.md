# Critique: `packages/fs-bridge` (`@ucdjs/fs-bridge`)

## Validation

- `pnpm --dir packages/fs-bridge run typecheck` -> passed
- `pnpm --dir packages/fs-bridge run build` -> passed
- package-local `test` script -> none

## Revised position

`fs-bridge` is not the core architectural mistake.

It is doing the correct category of job: generic filesystem-style access with path safety, optional capabilities, and multiple backends. The real storage mess starts one layer above it, where UCD-specific store semantics have to be reconstructed on top of a generic bridge contract.

So the valid criticism is narrower:

- `fs-bridge` is generic in the right way
- but the subsystem has not clearly separated generic filesystem behavior from UCD-store-specific behavior
- and `ucd-store` is forced to consume bridge mechanics too directly because that boundary is not explicit enough
- the current name also undersells the real role: this behaves more like the pluggable filesystem backend layer than a simple bridge helper

## Findings

### 1. `fs-bridge` is a transport abstraction, but higher layers are treating it like a store contract

Severity: high

Evidence:

- The public contract in [packages/fs-bridge/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/types.ts) is purely filesystem-oriented: `read`, `listdir`, `exists`, plus optional `write`, `mkdir`, and `rm`.
- The bridge factory in [packages/fs-bridge/src/define.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/define.ts) is deliberately generic and capability-driven.
- `@ucdjs/ucd-store` then has to layer version semantics, lockfile policy, store metadata, and API fallback on top of that contract in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts).

Why this is valid criticism:

- `fs-bridge` should not know about UCD-specific rules like `/ucd` path handling, manifests, snapshots, or lockfiles.
- But because there is no sharper UCD-specific contract above it, the generic bridge API leaks directly into the storage subsystem design.
- That makes `fs-bridge` look like the problem when it is really exposing the absence of a dedicated UCD store boundary.

What to do:

- Keep `fs-bridge` generic.
- Stop asking it to imply UCD store semantics.
- Introduce or document a clearer contract above it for:
- normalized store paths
- version-root layout
- metadata authority
- read-only remote store mode vs writable mirrored store mode

### 2. The package is really acting as a filesystem backend abstraction

Severity: high

Evidence:

- The contract in [packages/fs-bridge/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/types.ts) defines the full runtime backend interface that higher layers depend on.
- The concrete implementations in [packages/fs-bridge/src/bridges/node.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/bridges/node.ts) and [packages/fs-bridge/src/bridges/http.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/bridges/http.ts) are not just adapters; they are the actual backend implementations for local and remote storage access.

Why this is valid criticism:

- The term "bridge" makes this package sound smaller and more incidental than it actually is.
- In practice, `ucd-store` depends on it as the backend layer.
- That naming mismatch makes the storage architecture harder to talk about clearly.

What to do:

- Start referring to this layer as the filesystem backend layer in docs and criticism.
- Consider whether the long-term design should move from `fs-bridge` terminology to `fs-backend`.
- If that direction proves right, make it a deliberate migration of naming and API framing, not just a cosmetic rename.
- The likely long-term path is to deprecate `@ucdjs/fs-bridge` once the shared backend types and helper functions have been moved into a clearer `fs-backend` package and the pipeline-specific `SourceBackend` abstraction can be removed.
- The end goal would be a clearer `fs-backend` package, not a permanent expansion of the current `fs-bridge` naming.

### 3. The HTTP bridge exposes an important performance and semantics contract that is not explicit enough

Severity: high

Evidence:

- Recursive listing in [packages/fs-bridge/src/bridges/http.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/bridges/http.ts) walks children recursively by making repeated backend fetches.
- That means HTTP `listdir(path, true)` is not just a logical filesystem call; it can become multi-request traversal against the Store surface.

Why this is valid criticism:

- This is one of the most important runtime contracts in the package.
- It directly affects how well the HTTP bridge fits the Store worker.
- If Store is the intended backend, then recursive listing semantics need to be consciously accepted, optimized, or replaced, not left as incidental behavior.

What to do:

- Decide whether recursive HTTP listing is:
- an acceptable fallback contract
- or something Store should support more directly
- Document the current behavior clearly.
- If needed, add a dedicated recursive tree capability at the Store boundary instead of relying on implicit repeated traversal.

### 3. The package README is not trustworthy enough for such a foundational abstraction

Severity: high

Evidence:

- The example in [packages/fs-bridge/README.md](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/README.md) does not match the actual `defineFileSystemBridge()` object shape from [packages/fs-bridge/src/define.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/define.ts).
- The README still documents things like `stat()` that are not part of the current public interface in [packages/fs-bridge/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/src/types.ts).

Why this is valid criticism:

- This is not minor drift. It makes it harder to tell what the package really promises.
- In a foundational abstraction package, bad docs create downstream design confusion quickly.

What to do:

- Rewrite the README to document the real public contract.
- Include:
- required operations
- optional capabilities
- hooks
- bridge factory usage
- how the HTTP bridge is expected to behave against Store-like backends
- explain that these implementations are the filesystem backends used by higher-level store logic

### 4. `ucd-store` is consuming backend mechanics too directly

Severity: medium

Evidence:

- `UCDStoreOptions` exposes `FileSystemBridgeFactory`, `FileSystemBridgeArgs`, and generic `fsOptions` behavior in [packages/ucd-store/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/types.ts).
- `createUCDStore()` has `@ts-expect-error` around bridge invocation in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts).

Why this is valid criticism:

- This is not proof that `fs-bridge` is wrong.
- It is proof that the higher-level package is consuming the most generic part of the bridge API too directly.
- The real fix is not to make `fs-bridge` UCD-specific, but to give `ucd-store` a narrower backend consumption layer.

What to do:

- Keep the generic factory path for advanced use.
- Prefer narrower, explicit bridge presets at the `ucd-store` level.
- Reduce the number of places where high-level storage logic depends on raw bridge factory mechanics.

### 5. The package needs conformance tests against the Store surface, not just isolated unit coverage

Severity: medium

Evidence:

- The package has solid local tests in [packages/fs-bridge/test](/Users/luxass/dev/ucdjs/ucd/packages/fs-bridge/test), including security coverage.
- But those tests do not define the compatibility contract between the HTTP bridge and the real Store worker surface.

Why this is valid criticism:

- `fs-bridge` is only meaningful in this subsystem if the HTTP bridge behaves correctly against Store.
- Without those conformance tests, Store, `fs-bridge`, and `ucd-store` can drift independently.

What to do:

- Add Store-backed conformance coverage for the HTTP bridge:
- file reads
- existence checks
- directory listing
- recursive listing
- error semantics

### 6. If the terminology is changed, the package needs a real deprecation plan

Severity: low

Evidence:

- `fs-bridge` terminology is already used across imports, docs, tests, and higher-level package APIs throughout the repo.

Why this is valid criticism:

- A rename to something like `fs-backend` may be architecturally clearer.
- But a rename without a contract cleanup would only move confusion around.
- There is already overlapping backend terminology in pipelines via `SourceBackend` and `createSourceAdapter()`, but the stated direction is to remove that abstraction in favor of shared backend types and functions from the future `fs-backend` package.

What to do:

- Only deprecate `@ucdjs/fs-bridge` if you are also clarifying the backend contract.
- A sensible path would be:
- first switch docs and architecture language toward "filesystem backend"
- then extract the shared backend types and helper functions into `fs-backend`
- then migrate pipeline executor away from `SourceBackend` / `createSourceAdapter()` onto that shared backend model
- then introduce any cleaner API shape
- then deprecate `@ucdjs/fs-bridge` in favor of `@ucdjs/fs-backend` with compatibility shims

## What is good

- The generic bridge contract is the right kind of abstraction for this layer.
- The package has stronger security and unit coverage than many others in the repo.
- The Node and HTTP bridges are useful presets on top of the generic contract.

## Suggested next moves

1. Keep `fs-bridge` generic and stop treating it like the place where UCD store semantics should live.
2. Start describing it as the filesystem backend layer and decide whether that should become the eventual package/API model.
3. Document the real contract of the HTTP bridge, especially recursive listing behavior.
4. Rewrite the README so it matches the actual public API and backend role.
5. Add Store-backed conformance coverage for the HTTP bridge.
6. If the naming shift proves correct, plan a proper deprecation path from `fs-bridge` to a clearer `fs-backend` package, and remove the pipeline-specific `SourceBackend` abstraction in favor of the shared backend types/functions.
