---
name: Comprehensive fs-bridge path resolution security verification and fix
overview: "Comprehensively verify and fix fs-bridge path resolution to handle all scenarios securely: relative/absolute basePath × relative/absolute input paths, edge cases, and path traversal prevention. Consider API improvements for maintainability."
todos:
  - id: understand-resolvesafepath
    content: Analyze resolveSafePath implementation - understand current behavior for all scenarios
    status: pending
  - id: understand-node-bridge
    content: Analyze fs-bridge node bridge - understand how it uses resolveSafePath and basePath resolution
    status: pending
  - id: understand-http-bridge
    content: Analyze fs-bridge http bridge - understand baseUrl model and security differences
    status: pending
  - id: evaluate-api-improvements
    content: Evaluate API improvements - consider changing method signatures to take basePath separately for better maintainability
    status: pending
    dependencies:
      - understand-resolvesafepath
      - understand-node-bridge
      - understand-http-bridge
  - id: implement-api-improvements
    content: Implement API improvements if beneficial - update method signatures, update ALL test files (critical - many files), update type definitions, maintain backward compatibility if possible
    status: pending
    dependencies:
      - evaluate-api-improvements
  - id: create-test-suite-relative-basepath
    content: Create comprehensive test suite for relative basePath scenarios
    status: pending
    dependencies:
      - understand-resolvesafepath
      - understand-node-bridge
      - implement-api-improvements
  - id: create-test-suite-absolute-basepath
    content: Create comprehensive test suite for absolute basePath scenarios
    status: pending
    dependencies:
      - understand-resolvesafepath
      - understand-node-bridge
      - implement-api-improvements
  - id: create-test-suite-security
    content: Create comprehensive security test suite - path traversal, encoded attacks, etc.
    status: pending
    dependencies:
      - understand-resolvesafepath
  - id: create-test-suite-edge-cases
    content: Create comprehensive edge case test suite - empty paths, /, ., .., etc.
    status: pending
    dependencies:
      - understand-resolvesafepath
  - id: create-test-suite-bridge-methods
    content: Create test suite for all bridge methods with all path scenarios
    status: pending
    dependencies:
      - understand-node-bridge
      - understand-http-bridge
      - implement-api-improvements
  - id: run-comprehensive-tests
    content: Run all comprehensive tests and document failures
    status: pending
    dependencies:
      - create-test-suite-relative-basepath
      - create-test-suite-absolute-basepath
      - create-test-suite-security
      - create-test-suite-edge-cases
      - create-test-suite-bridge-methods
  - id: analyze-issues
    content: Analyze test failures - categorize as security/bugs/edge cases, determine if approach needs change
    status: pending
    dependencies:
      - run-comprehensive-tests
  - id: decision-point
    content: "Decision point: If approach flawed, pause and replan. If fixable, proceed."
    status: pending
    dependencies:
      - analyze-issues
  - id: fix-resolvesafepath
    content: Fix resolveSafePath bugs if any found - make controlled changes to path-utils package if needed to support fs-bridge better
    status: pending
    dependencies:
      - decision-point
  - id: fix-node-bridge
    content: Fix fs-bridge node bridge bugs if any found
    status: pending
    dependencies:
      - decision-point
  - id: fix-http-bridge
    content: Fix fs-bridge http bridge bugs if any found
    status: pending
    dependencies:
      - decision-point
  - id: add-regression-tests
    content: Add regression tests for all bugs fixed
    status: pending
    dependencies:
      - fix-resolvesafepath
      - fix-node-bridge
      - fix-http-bridge
  - id: security-audit
    content: Security audit - review all path resolution code, verify no traversal possible
    status: pending
    dependencies:
      - add-regression-tests
  - id: penetration-testing
    content: Penetration testing - try attack vectors, verify all blocked
    status: pending
    dependencies:
      - security-audit
---

# Comprehensive fs-bridge Path Resolution Security Verification and Fix

## Context

The fs-bridge is a security-critical layer between ucd-store and filesystems (node, vscode, http, etc.). It MUST:

- **Prevent path traversal outside basePath** (final resolved path must be within basePath)
- **Allow upward traversal (`..`) if final path stays within basePath** (e.g., `subdir/../file.txt` is allowed)
- Handle both relative and absolute basePaths
- Handle both relative and absolute input paths
- Work correctly in all combinations
- Be secure by default

**Security Model**: Paths are normalized (resolving `..` segments), then checked if final path is within basePath. This allows legitimate upward traversal within the boundary while preventing escape.

## Architecture Understanding

- **Node Bridge**: Uses `basePath` (can be relative or absolute)
- **HTTP Bridge**: Uses `baseUrl` (URL-based, different model)
- **resolveSafePath**: Core security function that validates paths stay within basePath
- **path-utils package**: Excellent package that provides `resolveSafePath` and security utilities - **use it!** If changes are needed to make fs-bridge work better, make them in a controlled way

## Critical Path Resolution Scenarios

### Scenario Matrix: basePath × inputPath

#### 1. Relative basePath + Relative input

- basePath: `./ucd-data`
- Input: `./ucd-data/test.txt` → Should resolve to `./ucd-data/test.txt` ✅
- Input: `test.txt` → Should resolve to `./ucd-data/test.txt` ✅
- Input: `subdir/../test.txt` → Normalizes to `test.txt` → Within basePath → ✅ Allowed
- Input: `../outside.txt` → Normalizes and checks final path - if outside basePath → Should throw PathTraversalError ❌

#### 2. Relative basePath + Absolute input

- basePath: `./ucd-data`
- Input: `/absolute/path/to/ucd-data/test.txt` → If within resolved basePath, should work ✅
- Input: `/etc/passwd` → Should be treated as relative or throw ❌

#### 3. Absolute basePath + Relative input

- basePath: `/absolute/path/to/ucd-data`
- Input: `./test.txt` → Should resolve to `/absolute/path/to/ucd-data/test.txt` ✅
- Input: `test.txt` → Should resolve to `/absolute/path/to/ucd-data/test.txt` ✅
- Input: `subdir/../test.txt` → Normalizes to `test.txt` → Resolves to `/absolute/path/to/ucd-data/test.txt` → Within basePath → ✅ Allowed
- Input: `v16.0.0/../v15.1.0/file.txt` → Normalizes to `v15.1.0/file.txt` → Within basePath → ✅ Allowed
- Input: `../outside.txt` → Normalizes to `/absolute/path/to/outside.txt` → Outside basePath → Should throw PathTraversalError ❌

#### 4. Absolute basePath + Absolute input

- basePath: `/absolute/path/to/ucd-data`
- Input: `/absolute/path/to/ucd-data/test.txt` → Should work (no double resolution) ✅
- Input: `/etc/passwd` → Should be treated as relative or throw ❌

#### 5. Edge Cases

- basePath: `/absolute/path` or `./relative/path`
- Input: `/` → Should resolve to basePath ✅
- Input: `.` → Should resolve to basePath ✅
- Input: `..` → Normalizes to parent directory, then checks if within basePath
- If `/absolute/path/..` → `/absolute` → Outside basePath → Should throw PathTraversalError ❌
- If `/absolute/path/subdir/..` → `/absolute/path` → Within basePath → ✅ Allowed
- Input: `../` → Same as `..` - normalize and check final path
- Input: `../../etc/passwd` → Normalizes to `/etc/passwd` → Outside basePath → Should throw PathTraversalError ❌
- **CRITICAL RULE**: Upward traversal (`..`) is **ALLOWED** if the final resolved path is still within basePath ✅

## Verification Phase

### Phase 1: Understand Current Implementation

1. **Analyze resolveSafePath behavior**

- Read and understand the implementation
- Document current behavior for all scenarios
- Identify any gaps or bugs

2. **Analyze fs-bridge node bridge**

- Understand how it uses resolveSafePath
- Document current behavior
- Check if basePath is resolved to absolute (line 39: `nodePath.resolve(options.basePath)`)

3. **Analyze fs-bridge http bridge**

- Understand how it handles paths differently (baseUrl vs basePath)
- Document differences
- Ensure security model is consistent

### Phase 2: Evaluate and Implement API Improvements

**Do this BEFORE comprehensive testing to reduce work:**

1. **Evaluate API Design**

- Current: Methods take `path: string`, basePath is in closure
- Proposed: Methods take `basePath: string, path: string` separately
- Benefits:
- Makes basePath explicit in method calls
- Easier to change basePath dynamically
- Clearer API - shows what's happening
- Better maintainability
- Could simplify path resolution logic

2. **Consider Implementation Options**

- Option A: Change method signatures to `read(basePath: string, path: string)`
- Option B: Keep current API but improve internal implementation
- Option C: Add overloads for backward compatibility
- Evaluate: Which is most maintainable? What's the migration path?

3. **Decision and Implementation**

- If API change is beneficial → Implement it now
- Update all bridge implementations (node, http)
- **Update all test files** (this is critical - many test files will need changes)
- Update type definitions
- Ensure backward compatibility if possible

4. **Benefits of Doing This Early**

- Test with new API from the start
- Avoid updating tests twice
- Reduce overall work
- Make path resolution logic clearer

### Phase 3: Create Comprehensive Test Suite

**Test Categories:**

1. **Relative basePath Tests**

- `./ucd-data` + relative inputs
- `./ucd-data` + absolute inputs
- Edge cases with relative basePath

2. **Absolute basePath Tests**

- `/absolute/path/to/ucd-data` + relative inputs
- `/absolute/path/to/ucd-data` + absolute inputs
- Edge cases with absolute basePath

3. **Security Tests** (in dedicated `test/security/` folder)

- **Path traversal that goes outside basePath** (`../../etc/passwd` when basePath is `/home/user`) → Should fail ❌
- **Path traversal that stays within basePath** (`subdir/../file.txt` when basePath is `/home/user`) → Should work ✅
- Encoded traversal (`%2e%2e%2f`) that goes outside → Should fail ❌
- Encoded traversal that stays within → Should work ✅
- Control characters, null bytes → Should fail ❌
- UNC paths (if applicable) → Should fail ❌
- Excessive encoding → Should fail ❌
- Boundary enforcement tests
- CWD independence tests (for absolute basePath)
- Mixed attack vectors
- **CRITICAL**: The security check happens AFTER normalization - final resolved path must be within basePath
- **Organize in dedicated `test/security/` folder for better discoverability and maintenance**

4. **Edge Case Tests**

- Empty paths: `""`
- Root: `/`
- Current directory: `.`
- Parent directory: `..` (normalize and check - fail only if outside basePath)
- **Upward traversal within basePath**: `subdir/../file.txt` → Should work ✅
- **Upward traversal outside basePath**: `../../etc/passwd` → Should fail ❌
- Mixed separators
- Trailing slashes
- Multiple slashes

5. **Bridge Method Tests**

- Test every method (`read`, `write`, `exists`, `listdir`, `mkdir`, `rm`)
- With every path scenario
- Verify correct behavior

6. **HTTP Bridge Tests**

- Verify baseUrl model works correctly
- Ensure security is maintained
- Handle differences from node bridge

### Phase 4: Identify and Document Issues

1. **Run comprehensive tests**

- Execute all test cases
- Document failures
- Categorize issues:
- Security vulnerabilities
- Bugs (incorrect behavior)
- Edge cases not handled

2. **Analyze root causes**

- Why do failures occur?
- Is it a bug or design issue?
- Can it be fixed or does approach need change?

3. **Decision point**

- If approach is fundamentally flawed → **PAUSE AND REPLAN**
- If bugs are fixable → Proceed to Phase 4

### Phase 5: Fix Issues

1. **Fix resolveSafePath if needed**

- Address any bugs found
- Ensure all scenarios work correctly
- Maintain security guarantees
- **Use path-utils package** - it's excellent! If changes are needed to make fs-bridge work better, make them in path-utils in a controlled way
- Ensure changes don't break existing path-utils consumers
- Add tests for any path-utils changes

2. **Fix fs-bridge node bridge if needed**

- Ensure correct use of resolveSafePath
- Verify basePath resolution
- Fix any bugs

3. **Fix fs-bridge http bridge if needed**

- Ensure consistent security model
- Handle baseUrl differences correctly

4. **Add regression tests**

- For every bug fixed
- Ensure it doesn't regress

### Phase 6: Verify Security

1. **Security audit**

- Review all path resolution code
- Verify no path traversal possible
- Verify boundary enforcement
- Verify CWD independence (for absolute basePath)

2. **Penetration testing**

- Try various attack vectors
- Verify all are blocked
- Document security guarantees

## Success Criteria

- ✅ All path resolution scenarios work correctly
- ✅ No path traversal outside basePath possible (unless final path stays within)
- ✅ Both relative and absolute paths work
- ✅ Edge cases handled correctly
- ✅ Security verified and documented
- ✅ API is maintainable and clear
- ✅ No regressions introduced

## Risk Mitigation

- **If approach doesn't work**: Pause, analyze, replan
- **If security issues found**: Fix immediately, don't proceed until secure
- **If too many edge cases**: Document them, handle systematically
- **If bridge API needs changes**: Evaluate maintainability benefits, minimize breaking changes, maintain backward compatibility if possible
- **Maintainability is key**: Code should be easy to understand and modify in the future
- **path-utils changes**: If changes needed to path-utils, make them in a controlled way:
- Ensure changes don't break existing consumers
- Add comprehensive tests
- Document changes clearly
- Consider backward compatibility

## Files to Review/Modify

1. `packages/path-utils/src/security.ts` - resolveSafePath implementation (may need controlled changes to support fs-bridge better)
2. `packages/path-utils/test/security.test.ts` - resolveSafePath tests (add tests for any changes)
3. `packages/fs-bridge/src/bridges/node.ts` - Node bridge implementation
4. `packages/fs-bridge/src/bridges/http.ts` - HTTP bridge implementation
5. `packages/fs-bridge/src/define.ts` - Bridge definition and setup
6. `packages/fs-bridge/src/types.ts` - Type definitions (may need updates for API changes)
7. `packages/fs-bridge/test/bridges/node.test.ts` - Node bridge tests
8. `packages/fs-bridge/test/bridges/http.test.ts` - HTTP bridge tests
9. `packages/fs-bridge/test/security/` - **NEW**: Dedicated security test folder

- `path-traversal.test.ts` - Path traversal attack tests
- `encoded-attacks.test.ts` - Encoded attack vector tests
- `boundary-enforcement.test.ts` - Boundary enforcement tests
- `control-characters.test.ts` - Control character and null byte tests
- `unc-paths.test.ts` - UNC path tests (if applicable)