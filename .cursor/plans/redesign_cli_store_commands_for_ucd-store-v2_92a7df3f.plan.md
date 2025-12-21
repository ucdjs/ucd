---
name: Redesign CLI store commands for ucd-store-v2
overview: Redesign the CLI store commands to align with the new ucd-store-v2 API. The new CLI will use an operation-based structure matching the API operations (sync, mirror, verify, analyze), keep init for bootstrap, add status command with lockfile inspection, support --force and --lockfile-only flags, and remove repair/clean commands.
todos:
  - id: update-package-json
    content: Update packages/cli/package.json to depend on @ucdjs/ucd-store-v2
    status: pending
  - id: update-shared-utilities
    content: Update packages/cli/src/cmd/store/_shared.ts to use ucd-store-v2 API and add force/lockfile-only flag handling
    status: pending
    dependencies:
      - update-package-json
  - id: update-init-command
    content: Update packages/cli/src/cmd/store/init.ts to use bootstrap from ucd-store-v2 with force/lockfile-only support
    status: pending
    dependencies:
      - update-shared-utilities
  - id: create-sync-command
    content: Create packages/cli/src/cmd/store/sync.ts with sync command implementation and force/lockfile-only flags
    status: pending
    dependencies:
      - update-shared-utilities
  - id: create-mirror-command
    content: Create packages/cli/src/cmd/store/mirror.ts with mirror command implementation and force/lockfile-only flags
    status: pending
    dependencies:
      - update-shared-utilities
  - id: create-verify-command
    content: Create packages/cli/src/cmd/store/verify.ts with verify command implementation and lockfile-only flag
    status: pending
    dependencies:
      - update-shared-utilities
  - id: create-status-command
    content: Create packages/cli/src/cmd/store/status.ts with status command and lockfile inspection capabilities
    status: pending
    dependencies:
      - update-shared-utilities
  - id: update-analyze-command
    content: Update packages/cli/src/cmd/store/analyze.ts to use new ucd-store-v2 API with lockfile-only flag
    status: pending
    dependencies:
      - update-shared-utilities
  - id: update-root-command
    content: Update packages/cli/src/cmd/store/root.ts with new command routing, help text, and remove repair/clean references
    status: pending
    dependencies:
      - create-sync-command
      - create-mirror-command
      - create-verify-command
      - create-status-command
  - id: delete-deprecated-commands
    content: Delete packages/cli/src/cmd/store/repair.ts and clean.ts files
    status: pending
    dependencies:
      - update-root-command
---

# Redesign CLI store commands for ucd-store-v2

## Overview

Redesign the CLI store commands to align with the new ucd-store-v2 API. The package name is `@ucdjs/ucd-store-v2`. The new CLI will use an operation-based structure that directly maps to the API operations, with lockfile inspection capabilities and flexible flag options.

## Current State

**Current CLI commands:**

- `ucd store init` - Initialize store (uses old `@ucdjs/ucd-store` package)
- `ucd store repair` - Repair store (not implemented, commented out) - **TO BE REMOVED**
- `ucd store clean` - Clean store (not implemented, commented out) - **TO BE REMOVED**
- `ucd store analyze` - Analyze store (uses old API)
- `ucd store status` - Show status (mentioned in help but not implemented)

**Current issues:**

- Uses old `@ucdjs/ucd-store` package (class-based API)
- Commands don't align with new ucd-store-v2 operations
- Missing sync, mirror, and verify commands
- No lockfile inspection capabilities

## New CLI Design

### Command Structure

```javascript
ucd store <command> [versions...] [flags]
```



### Commands

1. **`ucd store init [versions...]`** - Bootstrap a new store

- Creates lockfile with specified versions
- Validates versions against API
- Creates base directory if needed
- Flags: `--store-dir`, `--base-url`, `--include`, `--exclude`, `--force`, `--dry-run`, `--lockfile-only`

2. **`ucd store sync [versions...]`** - Sync lockfile with available versions

- Updates lockfile with versions from config/API
- Strategy: `--strategy=add|update` (default: add)
- Optionally mirror after sync: `--mirror`
- Flags: `--store-dir`, `--base-url`, `--strategy`, `--mirror`, `--include`, `--exclude`, `--force`, `--lockfile-only`

3. **`ucd store mirror [versions...]`** - Download files to local storage

- Downloads Unicode data files for specified versions
- Creates snapshots and updates lockfile
- Flags: `--store-dir`, `--base-url`, `--force`, `--concurrency`, `--include`, `--exclude`, `--lockfile-only`

4. **`ucd store verify [versions...]`** - Verify store integrity

- Checks lockfile versions against API
- Reports missing/extra versions
- Flags: `--store-dir`, `--base-url`, `--json`, `--lockfile-only`

5. **`ucd store analyze [versions...]`** - Analyze store contents

- Reports file counts, missing files, orphaned files
- Flags: `--store-dir`, `--base-url`, `--json`, `--check-orphaned`, `--include`, `--exclude`, `--lockfile-only`

6. **`ucd store status`** - Show store status with lockfile inspection

- Shows lockfile information (path, versions, snapshots)
- Lists versions in lockfile with their status
- Shows sync status (which versions are available in API)
- Shows mirror status (which versions have files downloaded)
- Flags: `--store-dir`, `--base-url`, `--json`, `--lockfile-only`

### Removed Commands

- **`repair`** - Removed (not needed with lockfile/snapshot system)
- **`clean`** - Removed (not needed, analyze can identify orphaned files)

### Flags

#### `--force` (command-specific behavior)

- **`init`**: Force bootstrap even if lockfile exists (recreate lockfile)
- Sets `bootstrap: true` and `versionStrategy: "overwrite"`
- **`sync`**: Overwrite lockfile with new versions
- Sets `versionStrategy: "overwrite"`
- **`mirror`**: Force re-download files even if they exist
- Sets `force: true` in mirror options
- **`verify`**: Skip validation errors, show all issues
- (No special behavior, just for consistency)
- **`analyze`**: Analyze even if store is incomplete
- (No special behavior, just for consistency)

#### `--lockfile-only` (read-only mode)

- **All commands**: Read-only mode - only read from lockfile, never create/update it
- Sets `bootstrap: false` when creating store
- Prevents lockfile writes during operations
- Useful for inspecting existing stores without modifying them
- For `init`: Fails if lockfile doesn't exist (instead of creating one)
- For `sync`: Shows what would change but doesn't update lockfile
- For `mirror`: Still downloads files but doesn't update lockfile metadata

### Lockfile Inspection

The `status` command provides comprehensive lockfile inspection:

- **Lockfile metadata**: Path, lockfile version, number of versions
- **Version details**: For each version in lockfile:
- Version number
- Snapshot path
- File count (from lockfile entry)
- Total size (from lockfile entry)
- Mirror status (snapshot file exists?)
- API availability (version exists in API?)
- **Summary**: Total versions, mirrored versions, available versions

## Implementation Plan

### Phase 1: Update Package Dependency

**File**: `packages/cli/package.json`Change dependency:

```json
{
  "dependencies": {
    "@ucdjs/ucd-store-v2": "workspace:*"
  }
}
```

**Important**: The package is `@ucdjs/ucd-store-v2` (not `@ucdjs/ucd-store`).

### Phase 2: Update Shared Utilities

**File**: `packages/cli/src/cmd/store/_shared.ts`Update to use ucd-store-v2:

```typescript
import type { UCDStore } from "@ucdjs/ucd-store-v2";
import { createNodeUCDStore, createHTTPUCDStore } from "@ucdjs/ucd-store-v2";

export interface CLIStoreCmdSharedFlags {
  storeDir?: string;
  remote?: boolean;
  include?: string[];
  exclude?: string[];
  baseUrl?: string;
  versions?: string[];
  force?: boolean;
  lockfileOnly?: boolean;
}

export async function createStoreFromFlags(
  flags: CLIStoreCmdSharedFlags
): Promise<UCDStore> {
  const { storeDir, remote, baseUrl, include, exclude, force, lockfileOnly } = flags;

  const options = {
    baseUrl,
    globalFilters: {
      include,
      exclude,
    },
    bootstrap: lockfileOnly ? false : true, // Read-only if lockfile-only
    versionStrategy: force ? "overwrite" : "strict",
  };

  if (remote) {
    return createHTTPUCDStore(options);
  }

  if (!storeDir) {
    throw new Error("Store directory must be specified when not using remote store.");
  }

  return createNodeUCDStore({
    ...options,
    basePath: storeDir,
    versions: flags.versions || [],
  });
}
```



### Phase 3: Implement New Commands

#### 3.1 Init Command (`packages/cli/src/cmd/store/init.ts`)

**Behavior**:

- If `--lockfile-only`: Fail if lockfile doesn't exist
- If `--force`: Overwrite existing lockfile
- Create store with bootstrap enabled (unless `--lockfile-only`)
- Show success message

#### 3.2 Sync Command (`packages/cli/src/cmd/store/sync.ts` - NEW)

**Behavior**:

- Load existing store
- If `--lockfile-only`: Show what would change but don't update
- Call `store.sync()` with strategy
- Show added/removed/unchanged versions
- Optionally mirror after sync if `--mirror` flag

**Flags**:

- `--strategy=add|update` (default: add)
- `--mirror` (mirror after sync)
- `--force` (overwrite strategy)
- `--lockfile-only` (read-only mode)

#### 3.3 Mirror Command (`packages/cli/src/cmd/store/mirror.ts` - NEW)

**Behavior**:

- Load existing store
- Call `store.mirror()` with options
- If `--force`: Re-download existing files
- If `--lockfile-only`: Download files but don't update lockfile metadata
- Show download progress and summary

**Flags**:

- `--force` (re-download existing files)
- `--concurrency=N` (default: 5)
- `--lockfile-only` (don't update lockfile)

#### 3.4 Verify Command (`packages/cli/src/cmd/store/verify.ts` - NEW)

**Behavior**:

- Load existing store
- Read lockfile versions
- Compare with API available versions
- Show verification results

**Note**: May need to expose verify operation or implement verification logic in CLI.

#### 3.5 Analyze Command (`packages/cli/src/cmd/store/analyze.ts`)

**Behavior**:

- Load existing store
- Call `store.analyze()` with options
- Show analysis results per version
- Update output format to match new API

#### 3.6 Status Command (`packages/cli/src/cmd/store/status.ts` - NEW)

**Behavior**:

- Load existing store (with `--lockfile-only` if specified)
- Read lockfile using `readLockfile()` from `@ucdjs/ucd-store-v2`
- For each version:
- Check if snapshot exists
- Check if version exists in API
- Show file count and total size from lockfile
- Display comprehensive status table

**Implementation**:

```typescript
import { readLockfile, getLockfilePath, readSnapshotOrDefault } from "@ucdjs/ucd-store-v2";
import { createNodeUCDStore } from "@ucdjs/ucd-store-v2";

// Read lockfile directly
const lockfilePath = getLockfilePath(storeDir);
const lockfile = await readLockfile(fs, lockfilePath);

// Check snapshots
for (const [version, entry] of Object.entries(lockfile.versions)) {
  const snapshot = await readSnapshotOrDefault(fs, basePath, version);
  const hasSnapshot = snapshot !== undefined;
  // ... show status
}
```



### Phase 4: Update Root Command

**File**: `packages/cli/src/cmd/store/root.ts`Update command routing and help:

```typescript
const STORE_SUBCOMMANDS = [
  "init",
  "sync",
  "mirror",
  "verify",
  "analyze",
  "status",
] as const;

// Update help text
tables: {
  Commands: [
    ["init", "Initialize an UCD Store (create lockfile)."],
    ["sync", "Sync lockfile with available versions from API."],
    ["mirror", "Download Unicode data files to local storage."],
    ["verify", "Verify store integrity against API."],
    ["analyze", "Analyze store contents and file status."],
    ["status", "Show store status and lockfile information."],
  ],
  Flags: [
    ["--store-dir", "Directory where the UCD files are stored."],
    ["--remote", "Use a Remote UCD Store."],
    ["--force", "Force operation (command-specific behavior)."],
    ["--lockfile-only", "Read-only mode: only read lockfile, never update it."],
    ["--help (-h)", "See all available flags."],
  ],
}
```



### Phase 5: Remove Deprecated Commands

**Files**:

- `packages/cli/src/cmd/store/repair.ts` - **DELETE**
- `packages/cli/src/cmd/store/clean.ts` - **DELETE**

Remove all references to these commands from root.ts.

## Command Examples

```bash
# Initialize a new store (creates lockfile)
ucd store init 16.0.0 15.1.0 --store-dir ./ucd-data

# Initialize with force (overwrite existing lockfile)
ucd store init 16.0.0 --store-dir ./ucd-data --force

# Initialize in read-only mode (fail if lockfile doesn't exist)
ucd store init --store-dir ./ucd-data --lockfile-only

# Sync lockfile (add new versions)
ucd store sync --store-dir ./ucd-data

# Sync with update strategy (remove unavailable versions)
ucd store sync --store-dir ./ucd-data --strategy update

# Sync and mirror new versions
ucd store sync --store-dir ./ucd-data --mirror

# Sync in read-only mode (show what would change)
ucd store sync --store-dir ./ucd-data --lockfile-only

# Mirror all versions
ucd store mirror --store-dir ./ucd-data

# Mirror specific versions with force
ucd store mirror 16.0.0 --store-dir ./ucd-data --force

# Mirror without updating lockfile
ucd store mirror --store-dir ./ucd-data --lockfile-only

# Verify store integrity
ucd store verify --store-dir ./ucd-data

# Analyze store contents
ucd store analyze --store-dir ./ucd-data --check-orphaned

# Show store status with lockfile inspection
ucd store status --store-dir ./ucd-data

# Show status in JSON format
ucd store status --store-dir ./ucd-data --json
```



## Lockfile Inspection Details

The `status` command will show:

```javascript
Store Status: /path/to/store
  Lockfile: .ucd-store.lock
  Lockfile Version: 1
  Total Versions: 2

  Version 16.0.0:
    Snapshot: v16.0.0/snapshot.json
    Status: ✓ Mirrored
    Files: 150
    Size: 12.5 MB
    API: ✓ Available
    
  Version 15.1.0:
    Snapshot: v15.1.0/snapshot.json
    Status: ⚠ Not mirrored
    Files: 0
    Size: 0 B
    API: ✓ Available

  Summary:
    Mirrored: 1/2 versions
    Available in API: 2/2 versions
```



## Files to Create/Modify

### Create:

1. `packages/cli/src/cmd/store/sync.ts` - Sync command
2. `packages/cli/src/cmd/store/mirror.ts` - Mirror command  
3. `packages/cli/src/cmd/store/verify.ts` - Verify command
4. `packages/cli/src/cmd/store/status.ts` - Status command with lockfile inspection

### Modify:

1. `packages/cli/src/cmd/store/_shared.ts` - Update to use ucd-store-v2, add force/lockfile-only flags
2. `packages/cli/src/cmd/store/init.ts` - Update to use bootstrap, support flags
3. `packages/cli/src/cmd/store/analyze.ts` - Update to use new API
4. `packages/cli/src/cmd/store/root.ts` - Update command routing and help, remove repair/clean references
5. `packages/cli/package.json` - Update dependency to `@ucdjs/ucd-store-v2`

### Delete:

1. `packages/cli/src/cmd/store/repair.ts` - **DELETE**
2. `packages/cli/src/cmd/store/clean.ts` - **DELETE**

## Benefits

1. **API Alignment**: CLI commands directly map to store operations
2. **Lockfile Inspection**: Status command provides comprehensive lockfile information
3. **Flexible Flags**: `--force` and `--lockfile-only` provide control over behavior
4. **Read-only Mode**: `--lockfile-only` enables safe inspection without modifications
5. **Intuitive**: Operation names match what they do