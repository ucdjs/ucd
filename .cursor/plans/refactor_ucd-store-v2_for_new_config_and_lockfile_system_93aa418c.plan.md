---
name: Refactor ucd-store-v2 for new config and lockfile system
overview: Update ucd-store-v2 to use the new ucd-config.json versions list and per-version manifest endpoint, replace the old .ucd-store.json lockfile pattern with the new lockfile system, and update bootstrap/sync operations accordingly.
todos:
  - id: update-context
    content: Replace manifestPath with lockfilePath in InternalUCDStoreContext and update createInternalContext
    status: pending
  - id: update-types
    content: Update types to remove manifestPath and add lockfilePath
    status: pending
  - id: update-store-creation
    content: Update createUCDStore to use versions from ucd-config.json, use lockfile instead of manifest, and remove all manifest file operations
    status: pending
    dependencies:
      - update-context
      - update-types
  - id: update-bootstrap
    content: Update bootstrap to create lockfile (not manifest) with versions from ucd-config.json. Do NOT fetch or store expectedFiles.
    status: pending
    dependencies:
      - update-store-creation
  - id: update-sync
    content: Update sync to use versions from ucd-config.json and update lockfile (not manifest). Do NOT fetch or store expectedFiles.
    status: pending
    dependencies:
      - update-store-creation
  - id: update-mirror
    content: Update mirror operation to create snapshots and update lockfile after mirroring files
    status: pending
    dependencies:
      - update-context
---

# Refactor ucd-store-v2 for new config and lockfile system

## Overview

This refactor updates `ucd-store-v2` to:

1. Use `ucd-config.json` for version discovery (instead of fetching from API)
2. Use the new per-version manifest endpoint `/.well-known/ucd-store/{version}.json` to fetch `expectedFiles` when needed (never store locally)
3. Replace the old `.ucd-store.json` lockfile pattern with the new lockfile system (`.ucd-store.lock` + snapshots)
4. Bootstrap should create a lockfile, not a manifest with expectedFiles

## Key Architectural Changes

**CRITICAL**: `expectedFiles` should NEVER be written to disk. It's only fetched from the well-known endpoint (`/.well-known/ucd-store/{version}.json`) when needed.**Old approach**:

- `.ucd-store.json` contained versions and their `expectedFiles` (stored locally)
- Used as both manifest and lockfile

**New approach**:

- `.ucd-store.lock` tracks what versions are mirrored (references to snapshots)
- `v{version}/snapshot.json` contains file hashes and metadata for mirrored files (e.g., `v16.0.0/snapshot.json`)
- `expectedFiles` is fetched from API endpoint when needed, never stored locally
- `.ucd-store.json` is deprecated/removed (no longer needed)

**Store directory structure**:

```javascript
store dir/
├── .ucd-store.lock
├── v16.0.0/
│   └── snapshot.json
└── v15.1.0/
    └── snapshot.json
```



## Changes Required

### 1. Remove manifest file usage and replace with lockfile

**Files**:

- `packages/ucd-store-v2/src/store.ts`
- `packages/ucd-store-v2/src/core/manifest.ts` (may need refactoring or removal)

**Changes**:

- Remove all code that reads/writes `.ucd-store.json` manifest file
- Replace manifest checks with lockfile checks
- Versions should come from lockfile (if exists) or from `ucd-config.json`

### 2. Update context to use lockfile instead of manifest

**File**: `packages/ucd-store-v2/src/core/context.ts`

- Remove `manifestPath` from `InternalUCDStoreContext`
- Add `lockfilePath` to `InternalUCDStoreContext`
- Update `createInternalContext` to use lockfile path instead of manifest path

### 3. Update bootstrap to create lockfile

**File**: `packages/ucd-store-v2/src/setup/bootstrap.ts`

- Remove manifest creation logic (`writeManifest` calls)
- Use versions from `ucd-config.json` (via endpoint config) or fallback to `client.versions.list()`
- Create an empty lockfile with the requested versions (no snapshots yet, since no files are mirrored)
- Lockfile structure: `{ lockfileVersion: 1, versions: { "16.0.0": { path: "v16.0.0/snapshot.json", fileCount: 0, totalSize: 0 }, ... } }`
- Snapshot paths should be relative to basePath and inside version directories (e.g., `v16.0.0/snapshot.json`)
- Do NOT fetch or store `expectedFiles` - that's only fetched from API when needed

### 4. Update sync to use ucd-config.json versions and update lockfile

**File**: `packages/ucd-store-v2/src/operations/sync.ts`

- Use versions from `ucd-config.json` (from endpoint config) instead of `client.versions.list()`
- Read existing lockfile to get current versions
- Add new versions to lockfile (with empty snapshots initially)
- Remove versions from lockfile if strategy is "update" and version is no longer available
- Do NOT fetch or store `expectedFiles`

### 5. Update store creation to use lockfile

**File**: `packages/ucd-store-v2/src/store.ts`

- Remove `manifestPath` and all manifest-related logic
- Add `lockfilePath` using `getLockfilePath(basePath)`
- Check for lockfile existence instead of manifest existence
- Read versions from lockfile if it exists
- Remove `readManifest` calls, replace with `readLockfileOrDefault`
- Remove `writeManifest` calls
- Extract versions from `ucd-config.json` when discovering endpoint config

### 6. Update mirror operation to create snapshots and update lockfile

**File**: `packages/ucd-store-v2/src/operations/mirror.ts`

- After mirroring files for a version:
- Compute file hashes using `computeFileHash` from lockfile module
- Create snapshot with file hashes and metadata
- Write snapshot using `writeSnapshot` (snapshot goes in `v{version}/snapshot.json`)
- Update lockfile entry for that version with snapshot path (e.g., `v16.0.0/snapshot.json`), fileCount, and totalSize
- Use `writeLockfile` to persist the updated lockfile

### 7. Update files operations to fetch expectedFiles from API when needed

**File**: `packages/ucd-store-v2/src/core/files.ts`

- The `getExpectedFilePaths` function should use `client.manifest.get(version)` to fetch `expectedFiles` from per-version endpoint
- Currently uses `client.versions.getFileTree(version)` - may need to change to use manifest endpoint
- This should fetch from API, never read from local storage

### 8. Update getSnapshotPath function

**File**: `packages/ucd-store-v2/src/core/lockfile.ts`

- Update `getSnapshotPath` to return `v{version}/snapshot.json` instead of `.snapshots/{version}.json`
- Path should be relative to basePath: `join(basePath, `v${version}`, "snapshot.json")`
- This ensures snapshots are stored inside version directories

### 9. Update types

**File**: `packages/ucd-store-v2/src/types.ts`

- Remove `manifestPath` from `InternalUCDStoreContext`
- Add `lockfilePath` to `InternalUCDStoreContext`
- Update `BootstrapOptions` to remove `manifestPath` and add `lockfilePath`
- Update `UCDStoreContext` type if needed

## Implementation Order

1. Update `getSnapshotPath` to use `v{version}/snapshot.json` structure
2. Update context to use lockfilePath instead of manifestPath
3. Update types to reflect lockfile instead of manifest
4. Update store creation to use lockfile instead of manifest and extract versions from config
5. Update bootstrap to create lockfile (not manifest) with correct snapshot paths
6. Update sync to use config versions and update lockfile
7. Update mirror to create snapshots and update lockfile
8. Update files operations to use manifest endpoint for expectedFiles