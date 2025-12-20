---
name: Design ideal test structure and refactor all tests
overview: Design a reusable test structure with helper utilities, then refactor all test files to use this consistent pattern. The ideal test should minimize boilerplate, be easy to read, and follow a clear Arrange-Act-Assert pattern.
todos:
  - id: create-test-helpers
    content: "Create test helper utilities: test-context.ts, lockfile-builder.ts, snapshot-builder.ts, and index.ts"
    status: pending
  - id: create-example-test
    content: Update one test file (e.g., bootstrap.test.ts) as example using new helpers
    status: pending
    dependencies:
      - create-test-helpers
  - id: update-bootstrap-tests
    content: Update bootstrap.test.ts using new test structure and helpers
    status: pending
    dependencies:
      - create-example-test
  - id: update-sync-tests
    content: Update sync.test.ts using new test structure, config mocking, and helpers
    status: pending
    dependencies:
      - create-example-test
  - id: update-verify-tests
    content: Update verify.test.ts using new test structure and helpers
    status: pending
    dependencies:
      - create-example-test
  - id: update-version-conflict-tests
    content: Update version-conflict.test.ts using new test structure and helpers
    status: pending
    dependencies:
      - create-example-test
  - id: update-mirror-tests
    content: Update mirror.test.ts using new test structure, snapshot builders, and helpers
    status: pending
    dependencies:
      - create-example-test
  - id: update-files-tests
    content: Update files operation tests using new test structure and manifest endpoint mocking
    status: pending
    dependencies:
      - create-example-test
  - id: update-remaining-tests
    content: Update all remaining test files (analyze, errors, etc.) using new test structure
    status: pending
    dependencies:
      - create-example-test
  - id: remove-manifest-tests
    content: Remove deprecated manifest.test.ts file
    status: pending
  - id: add-new-test-coverage
    content: Add new test files for snapshot operations, config discovery, and integration tests
    status: pending
    dependencies:
      - create-test-helpers
---

# Design ideal test structure and refactor all tests

## Overview

Design a reusable test structure with helper utilities that can be used consistently across all test files. This will minimize boilerplate, improve readability, and make tests easier to maintain.

## Ideal Test Structure Design

### 1. Test Helper Utilities

**New File**: `packages/ucd-store-v2/test/helpers/test-context.ts`Create a test context factory with sensible defaults:

```typescript
interface CreateTestContextOptions {
  basePath?: string;
  versions?: string[];
  lockfilePath?: string;
  lockfile?: Lockfile;
  initialFiles?: Record<string, string>;
  globalFilters?: PathFilterOptions;
  client?: UCDClient;
  configVersions?: string[];
}

function createTestContext(options?: CreateTestContextOptions): {
  context: InternalUCDStoreContext;
  fs: FileSystemBridge;
  client: UCDClient;
  basePath: string;
  lockfilePath: string;
}
```

**Features**:

- Creates client, fs, and context with sensible defaults
- Optionally creates lockfile if provided
- Optionally creates initial files
- Handles lockfilePath generation automatically
- Can inject custom client or use default

### 2. Lockfile Builder Helpers

**New File**: `packages/ucd-store-v2/test/helpers/lockfile-builder.ts`Create helpers for building test lockfiles:

```typescript
function createLockfile(versions: string[]): Lockfile
function createLockfileEntry(version: string, options?: {
  fileCount?: number;
  totalSize?: number;
  snapshotPath?: string;
}): LockfileVersionEntry
function createEmptyLockfile(versions: string[]): Lockfile
```

**Features**:

- Creates lockfile with correct structure
- Generates correct snapshot paths (`v{version}/snapshot.json`)
- Allows customization of fileCount, totalSize, etc.

### 3. Snapshot Builder Helpers

**New File**: `packages/ucd-store-v2/test/helpers/snapshot-builder.ts`Create helpers for building test snapshots:

```typescript
function createSnapshot(version: string, files: Record<string, string>): Snapshot
function createSnapshotWithHashes(version: string, files: Record<string, { content: string; hash: string; size: number }>): Snapshot
```

**Features**:

- Creates snapshots with correct structure
- Can compute hashes automatically or use provided ones
- Handles file paths correctly

### 4. API Mock Helpers

**Enhance**: Use `mockStoreApi` consistently with config-based approach**Pattern**:

```typescript
mockStoreApi({
  versions: ["16.0.0", "15.1.0"],
  responses: {
    "/.well-known/ucd-config.json": {
      version: "0.1",
      endpoints: { ... },
      versions: ["16.0.0", "15.1.0"], // config versions
    },
    "/.well-known/ucd-store/{version}.json": (params) => ({
      expectedFiles: [...]
    }),
  },
});
```



### 5. Test Structure Pattern

**Standard Pattern**:

```typescript
describe("feature name", () => {
  describe("scenario/behavior", () => {
    it("should do something specific", async () => {
      // Arrange
      const { context, fs } = createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });
      
      mockStoreApi({
        versions: ["16.0.0"],
        responses: { ... },
      });

      // Act
      const result = await someOperation(context);

      // Assert
      expect(result).toMatchObject({ ... });
      const lockfile = await readLockfile(fs, context.lockfilePath);
      expect(lockfile.versions).toHaveProperty("16.0.0");
    });
  });
});
```



## Implementation Plan

### Phase 1: Create Test Helpers

1. **Create test-context.ts helper**

- Factory function for creating test contexts
- Handles defaults (basePath, lockfilePath, client, etc.)
- Optionally creates lockfile and initial files

2. **Create lockfile-builder.ts helper**

- Functions for creating test lockfiles
- Handles snapshot path generation
- Supports empty and populated lockfiles

3. **Create snapshot-builder.ts helper**

- Functions for creating test snapshots
- Handles hash computation
- Supports various file structures

4. **Create test-helpers index.ts**

- Export all helpers from a single entry point
- Re-export commonly used test utilities

### Phase 2: Update Test Files Using New Structure

For each test file:

1. **Remove boilerplate** - Use `createTestContext` instead of manual setup
2. **Use builders** - Use lockfile/snapshot builders instead of manual JSON
3. **Consistent mocking** - Use `mockStoreApi` with config-based approach
4. **Clear structure** - Follow Arrange-Act-Assert pattern
5. **Split large tests** - Break into focused test suites

### Phase 3: Specific File Updates

1. **bootstrap.test.ts**

- Use `createTestContext` with lockfile options
- Use `createEmptyLockfile` for assertions
- Split into focused suites

2. **sync.test.ts**

- Use `createTestContext` with existing lockfile
- Mock config endpoint with versions
- Test config-based version discovery

3. **verify.test.ts**

- Use `createTestContext` with lockfile
- Update to use new verify signature

4. **version-conflict.test.ts**

- Use `createTestContext` and lockfile builders
- Test lockfile updates

5. **mirror.test.ts**

- Use `createTestContext`
- Use snapshot builders for assertions
- Test snapshot creation and lockfile updates

6. **files.test.ts**

- Use `createTestContext`
- Mock manifest endpoint instead of fileTree

7. **All other test files**

- Apply same patterns consistently

## Test Helper API Design

### createTestContext(options?)

```typescript
const { context, fs, client, basePath, lockfilePath } = createTestContext({
  basePath: "/test/store",           // default: "/test"
  versions: ["16.0.0"],             // default: []
  lockfile: createEmptyLockfile(...), // optional: creates lockfile
  initialFiles: {                    // optional: pre-populate filesystem
    "/test/store/v16.0.0/file.txt": "content",
  },
  globalFilters: { include: ["*.txt"] }, // optional
  configVersions: ["16.0.0"],       // optional: for config mocking
});
```



### createLockfile(versions, options?)

```typescript
const lockfile = createLockfile(["16.0.0", "15.1.0"], {
  withSnapshots: true,  // include snapshot entries
  fileCounts: { "16.0.0": 10, "15.1.0": 8 },
  totalSizes: { "16.0.0": 1024, "15.1.0": 512 },
});
```



### createSnapshot(version, files)

```typescript
const snapshot = createSnapshot("16.0.0", {
  "UnicodeData.txt": "file content",
  "PropList.txt": "more content",
});
// Automatically computes hashes and sizes
```



## Benefits

1. **Consistency** - All tests follow same pattern
2. **Readability** - Less boilerplate, clearer intent
3. **Maintainability** - Changes to test setup happen in one place
4. **Type Safety** - Helpers provide proper types
5. **Reusability** - Common patterns extracted to helpers

## Migration Strategy

1. Create helper files first
2. Update one test file as example/reference
3. Update remaining test files following the pattern
4. Remove deprecated manifest.test.ts