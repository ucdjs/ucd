# Critique: `packages/lockfile` (`@ucdjs/lockfile`)

## Validation

- `pnpm --dir packages/lockfile run typecheck` -> passed
- `pnpm --dir packages/lockfile run build` -> passed
- package-local `test` script -> none

## Revised position

`lockfile` is not the messy package in this subsystem.

Its boundary is comparatively healthy: it owns reading, writing, parsing, validating, and hashing lockfile/snapshot state. The real issue is that the wider subsystem has not been explicit enough about when lockfile/snapshot state is canonical and when manifest/API/Store metadata should be treated as canonical instead.

So the valid criticism here is mostly about role clarity and integration clarity, not package-internal architecture.

## Findings

### 1. The package boundary is healthy, but its place in the subsystem is under-documented

Severity: medium

Evidence:

- Lockfile and snapshot read/write/parse responsibilities are clearly separated in [packages/lockfile/src/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/lockfile.ts) and [packages/lockfile/src/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/snapshot.ts).
- The path helpers in [packages/lockfile/src/paths.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/paths.ts) define a clear on-disk layout.

Why this is valid criticism:

- The package itself is reasonably focused.
- The confusion comes from how the larger subsystem uses it.
- Contributors still need help understanding when lockfile/snapshot are the source of truth and when they are not.

What to do:

- Document the package as the canonical persisted state format for mirrored local stores.
- Explicitly state that this is not the same thing as generic remote manifest metadata.

### 2. The subsystem is attaching too much lifecycle meaning to lockfile presence

Severity: medium

Evidence:

- `ucd-store` uses lockfile presence and write-capable filesystem behavior to decide major store lifecycle branches in [packages/ucd-store/src/store.ts](/Users/luxass/dev/ucdjs/ucd/packages/ucd-store/src/store.ts).

Why this is valid criticism:

- This is not a flaw in `lockfile` itself.
- It is a clue that the rest of the subsystem is using lockfile state as both data and control-plane signal.
- That makes the role of lockfile feel larger and muddier than the package itself really is.

What to do:

- Keep `lockfile` focused on persisted store state.
- Move the stronger lifecycle framing into `ucd-store` docs and API semantics.
- Be explicit that lockfile presence is meaningful in mirrored local mode, not a universal store concept.

### 3. Remote Store metadata and local lockfile/snapshot state are too easy to conflate

Severity: medium

Evidence:

- `parseLockfile()` and `parseSnapshot()` in [packages/lockfile/src/lockfile.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/lockfile.ts) and [packages/lockfile/src/snapshot.ts](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/src/snapshot.ts) allow parsing content obtained from remote sources.
- Meanwhile the Store worker currently serves lockfile/snapshot-shaped responses from different backing data than mirrored local stores.

Why this is valid criticism:

- The package is flexible enough to consume remote content, which is good.
- The subsystem has not clearly established when remote lockfile/snapshot artifacts are equivalent to locally mirrored ones and when they are only compatibility artifacts.

What to do:

- Document the distinction clearly:
- mirrored local lockfile/snapshot state
- remote compatibility artifacts with the same shape
- Add conformance tests where remote lockfile/snapshot responses are expected to satisfy the same schema and semantics.

### 4. The README and examples should point at the real current boundaries

Severity: low

Evidence:

- The README examples in [packages/lockfile/README.md](/Users/luxass/dev/ucdjs/ucd/packages/lockfile/README.md) drift from the current Store boundary naming.

Why this is valid criticism:

- This is not an architectural problem.
- It is still worth fixing so the package docs do not add unnecessary confusion.

What to do:

- Update examples so they reference the actual current Store boundary and store layout.


## What is good

- The package has one of the clearest boundaries in the storage subsystem.
- The split between lockfile and snapshot concerns is sensible.
- Its problems are mostly caused by subsystem-level ambiguity, not by package-internal design confusion.

## Suggested next moves

1. Keep `lockfile` focused on persisted mirrored-store state.
2. Document clearly when lockfile/snapshot are canonical and when they are only compatibility-shaped remote artifacts.
3. Update the README examples to match the real current Store boundary.
