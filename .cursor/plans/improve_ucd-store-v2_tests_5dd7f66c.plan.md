---
name: Improve ucd-store-v2 tests
overview: Create comprehensive test utilities and helpers, then rewrite all test files to use standardized patterns and assertions. This will fix broken tests, improve maintainability, and establish consistent testing patterns across the codebase.
todos:
  - id: create-assertions
    content: Create test/helpers/assertions.ts with assertion helpers (expectLockfile, expectSnapshot, expectOperationResult, etc.)
    status: pending
  - id: create-builders
    content: Create test/helpers/builders.ts with test data builders (buildLockfile, buildSnapshot, buildTestFiles, etc.)
    status: pending
  - id: create-patterns
    content: Create test/helpers/patterns.ts with reusable test patterns (testOperationSuccess, testOperationError, etc.)
    status: pending
  - id: create-mocks
    content: Create test/helpers/mocks.ts with mock utilities (createMockMirrorReport, setupMockStore, etc.)
    status: pending
  - id: enhance-context
    content: Enhance test/helpers/test-context.ts with convenience methods and path normalization
    status: pending
  - id: create-index
    content: Create test/helpers/index.ts to export all helpers
    status: pending
    dependencies:
      - create-assertions
      - create-builders
      - create-patterns
      - create-mocks
  - id: rewrite-core-tests
    content: Rewrite core tests (config-discovery, context, files, lockfile, snapshot) to use new helpers
    status: pending
    dependencies:
      - create-index
  - id: rewrite-operation-tests
    content: Rewrite operation tests (sync, mirror, analyze, files operations) to use new helpers and fix issues
    status: pending
    dependencies:
      - create-index
  - id: rewrite-setup-tests
    content: Rewrite setup tests (bootstrap, verify) to use new helpers
    status: pending
    dependencies:
      - create-index
  - id: rewrite-integration-tests
    content: Rewrite integration tests to use new helpers and fix path inconsistencies
    status: pending
    dependencies:
      - create-index
  - id: rewrite-other-tests
    content: Rewrite remaining tests (errors, version-conflict) to use new helpers
    status: pending
    dependencies:
      - create-index
  - id: verify-all-tests
    content: Run all tests and verify they pass, fix any remaining issues
    status: pending
    dependencies:
      - rewrite-core-tests
      - rewrite-operation-tests
      - rewrite-setup-tests
      - rewrite-integration-tests
      - rewrite-other-tests
---

# Improve ucd-store-v2 Tests

## Overview

The current tests have several issues:

- Inconsistent test patterns and assertion styles
- Repetitive boilerplate code
- Missing reusable test helpers
- Some tests don't properly validate results
- Path inconsistencies (v16.0.0 vs 16.0.0)
- Mocking issues (e.g., sync.test.ts mocks mirror function)

## Implementation Plan

### Phase 1: Create Test Utilities and Helpers

#### 1.1 Test Assertion Helpers (`test/helpers/assertions.ts`)

Create helpers for common assertions:

- `expectLockfile()` - Assert lockfile structure and versions
- `expectSnapshot()` - Assert snapshot structure and files
- `expectOperationResult()` - Assert operation result structure (sync, mirror, analyze)
- `expectVersionInLockfile()` - Check version exists in lockfile with specific metadata
- `expectFileExists()` / `expectFileNotExists()` - File existence checks
- `expectError()` - Standardized error assertions

#### 1.2 Test Data Builders (`test/helpers/builders.ts`)

Create builders for test data:

- `buildLockfile()` - Create lockfile with versions, paths, metadata
- `buildSnapshot()` - Create snapshot with files and hashes
- `buildTestFiles()` - Create initial files structure for tests
- `buildMockApiResponse()` - Build API response structures

#### 1.3 Enhanced Test Context (`test/helpers/test-context.ts`)

Enhance existing `createTestContext`:

- Add convenience methods for common operations
- Support for version path normalization (v16.0.0 vs 16.0.0)
- Better integration with mockStoreApi
- Helper methods for reading lockfiles/snapshots

#### 1.4 Test Patterns (`test/helpers/patterns.ts`)

Create reusable test patterns:

- `testOperationSuccess()` - Standard pattern for testing successful operations
- `testOperationError()` - Standard pattern for testing error cases
- `testVersionSync()` - Pattern for testing version synchronization
- `testFileOperations()` - Pattern for testing file operations

#### 1.5 Mock Utilities (`test/helpers/mocks.ts`)

Enhance mocking capabilities:

- `createMockMirrorReport()` - Create mock mirror reports
- `createMockSyncResult()` - Create mock sync results
- `setupMockStore()` - Unified setup for mockStoreApi with common patterns
- `resetMocks()` - Clean up mocks between tests

### Phase 2: Rewrite Test Files

#### 2.1 Core Tests

- `test/core/config-discovery.test.ts` - Use new helpers
- `test/core/context.test.ts` - Use new helpers
- `test/core/files.test.ts` - Fix broken test, use new helpers
- `test/core/lockfile.test.ts` - Use new helpers
- `test/core/snapshot.test.ts` - Use new helpers

#### 2.2 Operation Tests

- `test/operations/sync.test.ts` - Remove mirror mock, use new helpers, fix path inconsistencies
- `test/operations/mirror.test.ts` - Use new helpers, standardize assertions
- `test/operations/analyze.test.ts` - Use new helpers, improve assertions
- `test/operations/files/get.test.ts` - Use new helpers
- `test/operations/files/list.test.ts` - Use new helpers
- `test/operations/files/tree.test.ts` - Use new helpers

#### 2.3 Setup Tests

- `test/setup/bootstrap.test.ts` - Use new helpers
- `test/setup/verify.test.ts` - Use new helpers

#### 2.4 Integration Tests

- `test/integration/store-operations.test.ts` - Use new helpers, fix path inconsistencies

#### 2.5 Other Tests

- `test/errors.test.ts` - Use new error assertion helpers
- `test/version-conflict.test.ts` - Use new helpers

### Phase 3: Standardization

#### 3.1 Path Normalization

- Ensure all tests use consistent paths (decide on v16.0.0 vs 16.0.0)
- Create helper to normalize version paths

#### 3.2 Test Structure

- Standardize Arrange-Act-Assert comments
- Consistent describe/it naming
- Consistent error handling patterns

#### 3.3 Documentation

- Add JSDoc comments to all test helpers
- Create test utilities README
- Document test patterns and best practices

## Key Files to Create/Modify

### New Files

- `packages/ucd-store-v2/test/helpers/assertions.ts` - Assertion helpers
- `packages/ucd-store-v2/test/helpers/builders.ts` - Test data builders
- `packages/ucd-store-v2/test/helpers/patterns.ts` - Reusable test patterns
- `packages/ucd-store-v2/test/helpers/mocks.ts` - Mock utilities
- `packages/ucd-store-v2/test/helpers/index.ts` - Export all helpers

### Modified Files

- `packages/ucd-store-v2/test/helpers/test-context.ts` - Enhance existing helper
- All test files in `packages/ucd-store-v2/test/` - Rewrite to use new utilities

## Implementation Details

### Assertion Helpers Example

```typescript
// assertions.ts
export function expectLockfile(
  lockfile: Lockfile,
  expectedVersions: string[],
  options?: { checkMetadata?: boolean }
) {
  const versions = Object.keys(lockfile.versions).sort();
  expect(versions).toEqual(expectedVersions.sort());
  
  if (options?.checkMetadata) {
    for (const version of expectedVersions) {
      expect(lockfile.versions[version]).toMatchObject({
        path: expect.stringMatching(/^\d+\.\d+\.\d+\/snapshot\.json$/),
        fileCount: expect.any(Number),
        totalSize: expect.any(Number),
      });
    }
  }
}
```



### Test Data Builder Example

```typescript
// builders.ts
export function buildLockfile(versions: string[], options?: {
  fileCount?: number;
  totalSize?: number;
  pathPrefix?: string;
}): Lockfile {
  const lockfile: Lockfile = {
    lockfileVersion: 1,
    versions: {},
  };
  
  for (const version of versions) {
    lockfile.versions[version] = {
      path: `${options?.pathPrefix || ''}${version}/snapshot.json`,
      fileCount: options?.fileCount ?? 0,
      totalSize: options?.totalSize ?? 0,
    };
  }
  
  return lockfile;
}
```



## Success Criteria

1. All tests pass consistently
2. Test code is DRY (Don't Repeat Yourself)
3. Consistent patterns across all test files
4. Easy to add new tests using established patterns
5. Clear separation of concerns (helpers vs test logic)
6. Comprehensive error handling in tests
7. Path consistency throughout

## Migration Strategy

1. Create all helper utilities first
2. Write example tests using new helpers