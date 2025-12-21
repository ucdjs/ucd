---
name: Fix analyze type errors and double directory path issue
overview: "Fix two issues: 1) Analyze command type errors - the CLI code accesses wrong properties from AnalysisReport (should use report.files.missing/orphaned and report.counts.present/expected instead of report.missingFiles/orphanedFiles and report.fileCount/expectedFileCount). 2) Double directory path issue - getLockfilePath returns an absolute path but should return a relative path since the filesystem bridge resolves paths relative to its basePath."
todos:
  - id: fix-analyze-types
    content: Fix analyze.ts to use correct AnalysisReport property paths (report.files.missing/orphaned, report.counts.present/expected)
    status: pending
  - id: fix-lockfile-path
    content: Fix getLockfilePath in ucd-store-v2 to return relative path (.ucd-store.lock) instead of absolute path
    status: pending
  - id: fix-init-lockfile-check
    content: Update init.ts to use getLockfilePath consistently and resolve path correctly for direct filesystem access
    status: pending
    dependencies:
      - fix-lockfile-path
  - id: fix-mirror-path-consistency
    content: Update mirror and file operations to use v{version} directory structure consistently
    status: pending
---

# Fix analyze type errors and double directory path issue

## Issues Identified

1. **Analyze command type errors**: The CLI code accesses incorrect properties from `AnalysisReport`. The actual structure uses nested objects:

- `report.files.missing` / `report.files.orphaned` (not `report.missingFiles` / `report.orphanedFiles`)
- `report.counts.present` / `report.counts.expected` (not `report.fileCount` / `report.expectedFileCount`)

2. **Double directory path**: When running `ucd store init 16.0.0 15.1.0 --store-dir ./ucd-data`, the lockfile is created at `ucd-data/ucd-data/.ucd-store.lock` instead of `ucd-data/.ucd-store.lock`. This happens because:

- `getLockfilePath(basePath)` returns `join(basePath, ".ucd-store.lock")` = `"./ucd-data/.ucd-store.lock"`
- The filesystem bridge resolves paths relative to its `basePath` (`"./ucd-data"`)
- So `fs.read("./ucd-data/.ucd-store.lock")` resolves to `"./ucd-data/./ucd-data/.ucd-store.lock"`

3. **Lockfile-only path check**: When running with `--lockfile-only`, the init command checks for `ucd-data/ucd-store.lock` (missing the dot prefix) instead of `ucd-data/.ucd-store.lock`. The code in `init.ts` manually constructs the path as `${storeDir}/.ucd-store.lock`, but this might not match how `getLockfilePath` constructs it, or there's an inconsistency in path resolution.
4. **Mirror path inconsistency**: When mirroring files, they are stored in `{version}/` directory (e.g., `16.0.0/`), but snapshots are stored in `v{version}/` directory (e.g., `v16.0.0/`). This creates an inconsistency:

- Files: `{basePath}/{version}/...` (e.g., `ucd-data/16.0.0/UnicodeData.txt`)
- Snapshots: `{basePath}/v{version}/snapshot.json` (e.g., `ucd-data/v16.0.0/snapshot.json`)
- The lockfile references `v{version}/snapshot.json`, so files should also be in `v{version}/` to be consistent.

## Root Cause

The `getLockfilePath` function in `packages/ucd-store-v2/src/core/lockfile.ts` returns an absolute path (`join(basePath, ".ucd-store.lock")`), but it should return a relative path (`".ucd-store.lock"`) since the filesystem bridge already uses `basePath` as its root.

## Solution

### Fix 1: Update analyze.ts CLI command

Update `packages/cli/src/cmd/store/analyze.ts` to use the correct property paths:

- Change `report.missingFiles` → `report.files.missing`
- Change `report.orphanedFiles` → `report.files.orphaned`  
- Change `report.fileCount` → `report.counts.present`
- Change `report.expectedFileCount` → `report.counts.expected`

### Fix 2: Fix getLockfilePath to return relative path

Update `packages/ucd-store-v2/src/core/lockfile.ts`:

- Change `getLockfilePath` to return `".ucd-store.lock"` instead of `join(basePath, ".ucd-store.lock")`
- This ensures the path is resolved correctly by the filesystem bridge relative to its basePath
- Note: The function signature should remain the same (taking `basePath` parameter) but ignore it and return the relative path

### Fix 3: Use getLockfilePath consistently in init.ts

Update `packages/cli/src/cmd/store/init.ts`:

- Replace manual path construction `${storeDir}/.ucd-store.lock` with `getLockfilePath(storeDir)`
- However, since we're using direct filesystem access (node:fs/promises) not the bridge, we need to resolve the path properly
- Use `path.join(storeDir, getLockfilePath(""))` or similar to get the absolute path for direct filesystem access
- Alternatively, import and use `getLockfilePath` and resolve it with `path.resolve(storeDir, getLockfilePath(""))`

### Fix 4: Fix mirror operation to use v{version} directory

Update `packages/ucd-store-v2/src/operations/mirror.ts`:

- Change line 299 from `join(context.basePath, version, filePath)` to `join(context.basePath, `v${version}`, filePath)`
- This ensures files are stored in `v{version}/` directory to match where snapshots are stored
- Also update `listFiles` operation in `packages/ucd-store-v2/src/operations/files/list.ts` line 45 to use `v${version}` instead of `version`
- Update `getFile` operation if it also uses version directory paths

## Files to Modify

1. `packages/cli/src/cmd/store/analyze.ts` - Fix property access for AnalysisReport
2. `packages/ucd-store-v2/src/core/lockfile.ts` - Fix getLockfilePath to return relative path
3. `packages/cli/src/cmd/store/init.ts` - Use getLockfilePath consistently and resolve path correctly for direct filesystem access
4. `packages/ucd-store-v2/src/operations/mirror.ts` - Change file storage path to use `v{version}` instead of `{version}`
5. `packages/ucd-store-v2/src/operations/files/list.ts` - Update to look for files in `v{version}` directory
6. `packages/ucd-store-v2/src/operations/files/get.ts` - Update to read files from `v{version}` directory (if needed)
7. `packages/ucd-store-v2/src/operations/files/tree.ts` - Update to read from `v{version}` directory (if needed)

## Testing

After fixes:

1. Run `ucd store init 16.0.0 15.1.0 --store-dir ./ucd-data` and verify lockfile is at `ucd-data/.ucd-store.lock`
2. Run `ucd store init --store-dir ./ucd-data --lockfile-only` and verify it correctly finds the lockfile at `ucd-data/.ucd-store.lock`
3. Run `ucd store analyze --store-dir ./ucd-data` and verify no type errors and correct output
4. Run `ucd store mirror 16.0.0 --store-dir ./ucd-data` and verify:

- Files are stored in `ucd-data/v16.0.0/` directory (not `ucd-data/16.0.0/`)
- Snapshot is stored in `ucd-data/v16.0.0/snapshot.json`