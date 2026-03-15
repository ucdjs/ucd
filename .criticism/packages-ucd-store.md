# Critique: `packages/ucd-store` (`@ucdjs/ucd-store`)

## Validation

- `pnpm --dir packages/ucd-store run typecheck` -> passed
- `pnpm --dir packages/ucd-store run build` -> passed
- `pnpm exec vitest run --project=ucd-store` -> 13 files passed, 3 skipped, 24 todo

## Revised position

`ucd-store` is not wrong for being the UCD-specific coordination layer.

That is its job. It is supposed to combine:

- endpoint discovery and client access
- generic filesystem access via `fs-bridge`, which is effectively the current backend layer
- lockfile and snapshot handling
- file access, mirroring, syncing, and reporting

The actual problem is that it currently has to represent two different store modes through one constructor and one runtime abstraction:

- a writable mirrored store with lockfile/snapshot state
- a read-only remote store-compatible view backed by Store/API metadata

That distinction is real in the code, but it is not explicit enough in the package model, so too much policy is hidden inside store creation.

## Findings

### 1. `createUCDStore()` is reconciling two different store modes without naming them clearly

Severity: high

Evidence:

- `createUCDStore()` in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts) does endpoint discovery, client creation, bridge construction, version resolution, lockfile detection, lockfile initialization, version conflict handling, and verification.
- The code path diverges based on whether the bridge supports write operations and whether a lockfile exists.

Why this is valid criticism:

- This is the heart of the subsystem mess.
- The package is not just "creating a store"; it is deciding whether you are in:
- mirrored local store mode
- or remote read-only store mode
- Because that distinction is not first-class, the constructor ends up feeling magical and overly policy-heavy.

What to do:

- Make the two modes explicit in docs and API framing:
- mirrored local store mode
- remote store-compatible mode
- Keep the high-level constructor if you want, but stop pretending both modes are the same thing.
- Make it clear which lifecycle steps apply in which mode.

### 2. Metadata authority is not cleanly defined across the subsystem

Severity: high

Evidence:

- `createInternalContext()` fetches expected files from the API manifest in [packages/ucd-store/src/context.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/context.ts).
- `sync()` prefers local snapshot metadata if available, then falls back to manifest data in [packages/ucd-store/src/tasks/sync.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/tasks/sync.ts).
- `mirror()` produces real snapshot hashes and sizes plus lockfile totals in [packages/ucd-store/src/tasks/mirror.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/tasks/mirror.ts).

Why this is valid criticism:

- The package is pulling truth from several places depending on mode and code path:
- lockfile
- snapshot
- manifest
- API version list
- discovered config
- That works, but it means the package does not have one obvious answer to "what is authoritative?"

What to do:

- Define authority by mode:
- mirrored local mode: lockfile + snapshot are canonical
- remote mode: Store-compatible metadata is canonical
- Document that clearly and align operations around it.

### 3. Path translation rules are real, but they are scattered instead of owned

Severity: high

Evidence:

- File reads add `/ucd` back when going through the API client in [packages/ucd-store/src/files/get.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/get.ts).
- Local and HTTP bridge reads use Store-style paths without `/ucd` in [packages/ucd-store/src/files/list.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/list.ts), [packages/ucd-store/src/files/tree.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/files/tree.ts), and [packages/ucd-store/src/tasks/mirror.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/tasks/mirror.ts).

Why this is valid criticism:

- The path split itself is valid:
- API file space is broader
- Store view is narrower and UCD-focused
- The mess is that the translation rule is reimplemented in multiple places instead of being treated as a first-class contract.

What to do:

- Centralize the path model:
- normalized internal store path
- API path
- Store path
- Make file operations and mirroring consume that one translation layer instead of hand-building path rules repeatedly.

### 4. The public options still expose too much raw bridge machinery

Severity: medium

Evidence:

- `UCDStoreOptions` in [packages/ucd-store/src/types.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/types.ts) exposes generic `fs`, `FileSystemBridgeFactory`, and `fsOptions`.
- The package already has convenience factories in [packages/ucd-store/src/factory.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/factory.ts).

Why this is valid criticism:

- The generic path is useful, but it should be the advanced path.
- Most consumers conceptually want either:
- a Node-backed mirrored store
- or an HTTP-backed remote store
- Right now the public surface still leads with the lower-level machinery too much.
- The current "bridge" wording also hides that `ucd-store` is really depending on a pluggable backend contract.

What to do:

- Make `createNodeUCDStore()` and `createHTTPUCDStore()` the clearly preferred entrypoints.
- Position the raw `fs` + `fsOptions` path as advanced.
- Reduce the visible bridge-construction complexity for ordinary consumers.
- If the subsystem moves toward `fs-backend` terminology, align `ucd-store` around that backend concept rather than the current bridge wording.

### 5. Store creation mixes attachment, initialization, and verification too aggressively

Severity: medium

Evidence:

- `createUCDStore()` both attaches to a backend and may initialize a lockfile, validate versions, resolve conflicts, and verify state in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts).

Why this is valid criticism:

- Those behaviors may all belong in the package.
- The problem is that they are not framed as separate lifecycle phases.
- That makes it difficult to understand the cost and semantics of "creating a store."

What to do:

- Document the lifecycle explicitly:
- attach/open
- initialize if needed
- verify if enabled
- sync/mirror if requested
- Consider whether some of this should become more explicit in the API over time.

### 6. Compatibility coverage with the real Store boundary is still incomplete

Severity: medium

Evidence:

- There are `todo` integration suites in:
- [packages/ucd-store/test/integration/http/files.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/test/integration/http/files.test.ts)
- [packages/ucd-store/test/integration/node/files.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/test/integration/node/files.test.ts)
- [packages/ucd-store/test/integration/node/store.test.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/test/integration/node/store.test.ts)

Why this is valid criticism:

- `ucd-store` is one of the main packages that should prove the storage contract works.
- Right now much of the logic is tested locally, but the Store-backed compatibility boundary is not finished.

What to do:

- Finish the integration suites that already exist as `todo`.
- Add explicit compatibility assertions for:
- file reads
- directory/tree listing
- version discovery
- manifest consumption
- lockfile/snapshot behavior where applicable

### 7. The docs understate the package badly

Severity: medium

Evidence:

- The README in [packages/ucd-store/README.md](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/README.md) describes the package as simple/lightweight.
- The docs page in [apps/docs/content/architecture/ucd-store.mdx](/Users/luxass/dev/ucdjs/ucd/apps/docs/content/architecture/ucd-store.mdx) is too thin for the real package behavior.

Why this is valid criticism:

- This package is not simple in semantics.
- The docs need to explain the two modes and the metadata/path rules, otherwise the code will keep being the only real documentation.

What to do:

- Rewrite the README and docs around:
- what `ucd-store` coordinates
- mirrored local mode vs remote mode
- path translation rules
- metadata authority
- how lockfile/snapshot relate to Store/API metadata

## What is good

- The package is doing the right category of work for this subsystem.
- The Node and HTTP convenience factories are useful and point in the right direction.
- The test base is meaningful, even if the Store-backed integration contract is unfinished.

## Suggested next moves

1. Explicitly define the two supported store modes in `ucd-store`.
2. Define metadata authority per mode.
3. Centralize API-path vs Store-path translation instead of scattering it through file operations.
4. Make the convenience factories the preferred public entrypoints.
5. Finish the Store-backed compatibility tests that already exist as `todo`.
6. Rewrite the docs around the real lifecycle and semantics.
