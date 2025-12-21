# @ucdjs/lockfile

Lockfile and snapshot management utilities for UCD stores.

## Installation

```bash
pnpm add @ucdjs/lockfile
```

## Usage

### Reading and Writing Lockfiles

```typescript
import { readLockfile, writeLockfile, getLockfilePath } from "@ucdjs/lockfile";
import { NodeFileSystemBridge } from "@ucdjs/fs-bridge";

const fs = NodeFileSystemBridge({ basePath: "./store" });
const lockfilePath = getLockfilePath("./store");

// Read lockfile
const lockfile = await readLockfile(fs, lockfilePath);

// Write lockfile
await writeLockfile(fs, lockfilePath, {
  lockfileVersion: 1,
  versions: {
    "16.0.0": {
      path: "16.0.0/snapshot.json",
      fileCount: 10,
      totalSize: 1024,
    },
  },
});
```

### Reading and Writing Snapshots

```typescript
import { readSnapshot, writeSnapshot, getSnapshotPath } from "@ucdjs/lockfile";

const basePath = "./store";
const version = "16.0.0";

// Read snapshot
const snapshot = await readSnapshot(fs, basePath, version);

// Write snapshot
await writeSnapshot(fs, basePath, version, {
  unicodeVersion: "16.0.0",
  files: {
    "UnicodeData.txt": {
      hash: "sha256:...",
      size: 1024,
    },
  },
});
```

### Computing File Hashes

```typescript
import { computeFileHash } from "@ucdjs/lockfile";

const content = "file content";
const hash = await computeFileHash(content);
// Returns: "sha256:..."
```

## API Reference

### Lockfile Operations

- `canUseLockfile(fs: FileSystemBridge): boolean` - Check if bridge supports lockfile operations
- `readLockfile(fs: FileSystemBridge, lockfilePath: string): Promise<Lockfile>` - Read and validate lockfile
- `writeLockfile(fs: FileSystemBridge, lockfilePath: string, lockfile: Lockfile): Promise<void>` - Write lockfile
- `readLockfileOrDefault(fs: FileSystemBridge, lockfilePath: string): Promise<Lockfile | undefined>` - Read lockfile or return undefined

### Snapshot Operations

- `readSnapshot(fs: FileSystemBridge, basePath: string, version: string): Promise<Snapshot>` - Read and validate snapshot
- `writeSnapshot(fs: FileSystemBridge, basePath: string, version: string, snapshot: Snapshot): Promise<void>` - Write snapshot
- `readSnapshotOrDefault(fs: FileSystemBridge, basePath: string, version: string): Promise<Snapshot | undefined>` - Read snapshot or return undefined

### Path Utilities

- `getLockfilePath(_basePath: string): string` - Get default lockfile path (`.ucd-store.lock`)
- `getSnapshotPath(basePath: string, version: string): string` - Get snapshot path for version

### Hash Utilities

- `computeFileHash(content: string | Uint8Array): Promise<string>` - Compute SHA-256 hash

### Error Types

- `LockfileInvalidError` - Thrown when a lockfile or snapshot is invalid
- `LockfileBridgeUnsupportedOperation` - Thrown when a filesystem bridge operation is not supported

## Test Utilities

The package also exports test utilities for creating lockfiles and snapshots in tests:

```typescript
import {
  createEmptyLockfile,
  createLockfile,
  createLockfileEntry,
  createSnapshot,
  createSnapshotWithHashes,
} from "@ucdjs/lockfile/test-utils";

// Create an empty lockfile
const lockfile = createEmptyLockfile(["16.0.0", "15.1.0"]);

// Create a lockfile with custom options
const customLockfile = createLockfile(["16.0.0"], {
  fileCounts: { "16.0.0": 10 },
  totalSizes: { "16.0.0": 1024 },
});

// Create a snapshot
const snapshot = await createSnapshot("16.0.0", {
  "UnicodeData.txt": "file content",
  "Blocks.txt": "more content",
});
```

## License

MIT

