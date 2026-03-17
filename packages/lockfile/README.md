# @ucdjs/lockfile

Lockfile and snapshot management utilities for UCD stores.

## Installation

```bash
pnpm add @ucdjs/lockfile
```

## Usage

### Reading and Writing Lockfiles

```typescript
import { NodeFileSystemBridge } from "@ucdjs/fs-bridge";
import { getLockfilePath, readLockfile, writeLockfile } from "@ucdjs/lockfile";

const fs = NodeFileSystemBridge({ basePath: "./store" });
const lockfilePath = getLockfilePath();

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

### Parsing Lockfiles Without a Filesystem Bridge

When you already have the lockfile content as a string (e.g., fetched from HTTP, read from a KV store, etc.), you can parse and validate it directly without needing a filesystem bridge:

```typescript
import { parseLockfile, parseLockfileOrUndefined } from "@ucdjs/lockfile";

// Parse from a fetch response
const response = await fetch("https://ucdjs.dev/.ucd-store.lock");
const content = await response.text();
const lockfile = parseLockfile(content);

// Or use the non-throwing variant
const lockfileOrUndefined = parseLockfileOrUndefined(content);
if (lockfileOrUndefined) {
  console.log("Lockfile version:", lockfileOrUndefined.lockfileVersion);
}
```

### Reading and Writing Snapshots

```typescript
import { getSnapshotPath, parseSnapshot, parseSnapshotOrUndefined, readSnapshot, writeSnapshot } from "@ucdjs/lockfile";

const version = "16.0.0";

// Read snapshot
const snapshot = await readSnapshot(fs, version);

// Write snapshot
await writeSnapshot(fs, version, {
  unicodeVersion: "16.0.0",
  files: {
    "UnicodeData.txt": {
      hash: "sha256:...",
      size: 1024,
    },
  },
});

// Parse snapshot content directly (without a filesystem bridge)
const response = await fetch("https://ucdjs.dev/16.0.0/snapshot.json");
const content = await response.text();
const parsedSnapshot = parseSnapshot(content);

// Or use the non-throwing variant
const parsedSnapshotOrUndefined = parseSnapshotOrUndefined(content);
```

### Computing File Hashes

```typescript
import { computeFileHash } from "@ucdjs/lockfile";

const content = "file content";
const hash = await computeFileHash(content);
// Returns: "sha256:..."
```

## Overview

`@ucdjs/lockfile` manages the canonical persisted state for mirrored local UCD stores. Two artifacts define what's in a local store:

- **Lockfile** (`.ucd-store.lock`) — index of all mirrored Unicode versions, with their snapshot paths, file counts, and total sizes.
- **Snapshots** (`{version}/snapshot.json`) — per-version manifest listing every file, its hash, and size.

Together these are the source of truth for a local store. The `parseLockfile()` and `parseSnapshot()` utilities also accept content from remote sources (HTTP, KV stores) with the same shape, but those are read-only compatibility uses — not local store management.

## API Reference

### Lockfile Operations

- `canUseLockfile(fs: FileSystemBridge): boolean` - Check if bridge supports lockfile operations
- `readLockfile(fs: FileSystemBridge, lockfilePath: string): Promise<Lockfile>` - Read and validate lockfile
- `writeLockfile(fs: FileSystemBridge, lockfilePath: string, lockfile: Lockfile): Promise<void>` - Write lockfile
- `readLockfileOrUndefined(fs: FileSystemBridge, lockfilePath: string): Promise<Lockfile | undefined>` - Read lockfile or return undefined
- `parseLockfile(content: string): Lockfile` - Parse and validate lockfile from a raw string
- `parseLockfileOrUndefined(content: string): Lockfile | undefined` - Parse lockfile from a raw string or return undefined
- `validateLockfile(data: unknown): ValidateLockfileResult` - Validate lockfile data without reading from filesystem

### Snapshot Operations

- `readSnapshot(fs: FileSystemBridge, version: string): Promise<Snapshot>` - Read and validate snapshot
- `writeSnapshot(fs: FileSystemBridge, version: string, snapshot: Snapshot): Promise<void>` - Write snapshot
- `readSnapshotOrUndefined(fs: FileSystemBridge, version: string): Promise<Snapshot | undefined>` - Read snapshot or return undefined
- `parseSnapshot(content: string): Snapshot` - Parse and validate snapshot from a raw string
- `parseSnapshotOrUndefined(content: string): Snapshot | undefined` - Parse snapshot from a raw string or return undefined

### Path Utilities

- `getLockfilePath(): string` - Get default lockfile path (`.ucd-store.lock`)
- `getSnapshotPath(version: string): string` - Get snapshot path for version

### Hash Utilities

- `computeFileHash(content: string | Uint8Array): Promise<string>` - Compute SHA-256 hash
- `computeFileHashWithoutUCDHeader(content: string): Promise<string>` - Compute SHA-256 hash after stripping the Unicode file header (useful for comparing content across versions)
- `stripUnicodeHeader(content: string): string` - Strip the Unicode file header (filename, date, copyright lines) from content

### Error Types

- `LockfileBaseError` - Base error class for all lockfile errors
- `LockfileInvalidError` - Thrown when a lockfile or snapshot is invalid

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
