---
name: Comprehensive fs-bridge path resolution security verification and fix
overview: Comprehensively verify and fix fs-bridge path resolution to handle all scenarios securely. Focus on verifying resolveSafePath behavior, bridge implementations, and security. Only consider API changes as a last resort if issues cannot be fixed otherwise.
todos:
  - id: understand-resolvesafepath
    content: Analyze resolveSafePath implementation - understand current behavior for all scenarios. Add tests to path-utils if gaps are found.
    status: completed
  - id: understand-node-bridge
    content: Analyze fs-bridge node bridge - understand how it uses resolveSafePath and basePath resolution
    status: completed
  - id: understand-http-bridge
    content: Analyze fs-bridge http bridge - understand baseUrl model and security differences
    status: completed
  - id: create-security-test-folder
    content: Create packages/fs-bridge/test/security/ folder structure
    status: completed
  - id: create-test-suite-relative-basepath
    content: Create comprehensive test suite for relative basePath scenarios
    status: completed
    dependencies:
      - understand-resolvesafepath
      - understand-node-bridge
  - id: create-test-suite-absolute-basepath
    content: Create comprehensive test suite for absolute basePath scenarios
    status: completed
    dependencies:
      - understand-resolvesafepath
      - understand-node-bridge
  - id: create-test-suite-security
    content: Create comprehensive security test suite - path traversal, encoded attacks, etc. Add corresponding tests to path-utils if needed.
    status: completed
    dependencies:
      - understand-resolvesafepath
      - create-security-test-folder
  - id: create-http-security-tests
    content: Create comprehensive HTTP bridge security test suite in packages/fs-bridge/test/security/http/ - path traversal, encoded attacks, boundary enforcement, excessive encoding, mixed attacks. Use mockFetch for HTTP mocking and test with different baseUrl.pathname configurations (shallow and deep).
    status: completed
    dependencies:
      - create-test-suite-security
      - understand-http-bridge
  - id: create-test-suite-edge-cases
    content: Create comprehensive edge case test suite - empty paths, /, ., .., etc. Add corresponding tests to path-utils if needed.
    status: completed
    dependencies:
      - understand-resolvesafepath
  - id: create-test-suite-bridge-methods
    content: Create test suite for all bridge methods with all path scenarios
    status: completed
    dependencies:
      - understand-node-bridge
      - understand-http-bridge
  - id: run-comprehensive-tests
    content: Run all comprehensive tests and document failures
    status: completed
    dependencies:
      - create-test-suite-relative-basepath
      - create-test-suite-absolute-basepath
      - create-test-suite-security
      - create-http-security-tests
      - create-test-suite-edge-cases
      - create-test-suite-bridge-methods
  - id: analyze-issues
    content: Analyze test failures - categorize as security/bugs/edge cases, determine if approach needs change
    status: completed
    dependencies:
      - run-comprehensive-tests
  - id: decision-point
    content: "Decision point: If approach flawed, pause and replan. If fixable, proceed. Only evaluate API changes if fixing without API changes fails."
    status: in_progress
    dependencies:
      - analyze-issues
  - id: evaluate-api-improvements
    content: Evaluate API improvements ONLY IF fixing without API changes failed - MUST ask for permission with concrete example before proceeding
    status: pending
    dependencies:
      - decision-point
  - id: request-api-change-permission
    content: Request explicit permission for API changes - provide concrete example showing problem, solution, and impact
    status: pending
    dependencies:
      - evaluate-api-improvements
  - id: fix-resolvesafepath
    content: Fix resolveSafePath bugs if any found - make controlled changes to path-utils package if needed to support fs-bridge better
    status: pending
    dependencies:
      - decision-point
      - request-api-change-permission
  - id: fix-node-bridge
    content: Fix fs-bridge node bridge bugs if any found
    status: completed
    dependencies:
      - decision-point
      - request-api-change-permission
  - id: fix-http-bridge
    content: Fix fs-bridge http bridge bugs if any found
    status: pending
    dependencies:
      - decision-point
      - request-api-change-permission
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

**Note**: This plan focuses ONLY on verifying and fixing fs-bridge itself. ucd-store modifications are deferred to a later phase.**Security Model**: Paths are normalized (resolving `..` segments), then checked if final path is within basePath. This allows legitimate upward traversal within the boundary while preventing escape.

## Architecture Understanding

- **Node Bridge**: Uses `basePath` from options (resolved to absolute), resolves paths relative to it
- **HTTP Bridge**: Uses `baseUrl.pathname` as basePath from options, resolves paths relative to it
- **resolveSafePath**: Core security function that validates paths stay within basePath
- **path-utils package**: Excellent package that provides `resolveSafePath` and security utilities - **use it!** If changes are needed to make fs-bridge work better, make them in a controlled way

## Critical Path Resolution Scenarios

### Scenario Matrix: basePath × inputPath

#### 1. Relative basePath + Relative input

- basePath: `./ucd-data`
- Input: `test.txt` → Should resolve to `./ucd-data/test.txt` ✅
- Input: `v16.0.0/file.txt` → Should resolve to `./ucd-data/v16.0.0/file.txt` ✅
- Input: `subdir/../test.txt` → Normalizes to `test.txt` → Within basePath → ✅ Allowed
- Input: `../outside.txt` → Normalizes and checks final path - if outside basePath → Should throw PathTraversalError ❌

#### 2. Relative basePath + Absolute input

- basePath: `./ucd-data`
- Input: `/test.txt` → Should be treated as relative (virtual filesystem boundary) → Resolves to `./ucd-data/test.txt` ✅
- Input: `/etc/passwd` → Should be treated as relative → Resolves to `./ucd-data/etc/passwd` ✅ (or throw if outside)

#### 3. Absolute basePath + Relative input

- basePath: `/absolute/path/to/ucd-data`
- Input: `test.txt` → Should resolve to `/absolute/path/to/ucd-data/test.txt` ✅
- Input: `v16.0.0/file.txt` → Should resolve to `/absolute/path/to/ucd-data/v16.0.0/file.txt` ✅
- Input: `subdir/../test.txt` → Normalizes to `test.txt` → Resolves to `/absolute/path/to/ucd-data/test.txt` → Within basePath → ✅ Allowed
- Input: `v16.0.0/../v15.1.0/file.txt` → Normalizes to `v15.1.0/file.txt` → Within basePath → ✅ Allowed
- Input: `../outside.txt` → Normalizes to `/absolute/path/to/outside.txt` → Outside basePath → Should throw PathTraversalError ❌

#### 4. Absolute basePath + Absolute input

- basePath: `/absolute/path/to/ucd-data`
- Input: `/absolute/path/to/ucd-data/test.txt` → If within basePath, should work ✅
- Input: `/test.txt` → Should be treated as relative (virtual filesystem boundary) → Resolves to `/absolute/path/to/ucd-data/test.txt` ✅
- Input: `/etc/passwd` → Should be treated as relative → Resolves to `/absolute/path/to/ucd-data/etc/passwd` ✅ (or throw if outside)

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

## Implementation Phases

### Phase 1: Understand Current Implementation

1. **Analyze resolveSafePath behavior**

- Read and understand the implementation
- Document current behavior for all scenarios
- Identify any gaps or bugs
- **Add tests to path-utils package** if scenarios are missing or need verification

2. **Analyze fs-bridge node bridge**

- Understand how it uses resolveSafePath
- Document current behavior
- Verify basePath is resolved to absolute (line 39: `nodePath.resolve(options.basePath)`)

3. **Analyze fs-bridge http bridge**

- Understand how it handles paths differently (baseUrl vs basePath)
- Document differences
- Ensure security model is consistent

### Phase 2: Create Comprehensive Test Suite

**Test Categories:**

1. **Relative basePath Tests**

- `./ucd-data` + relative inputs
- `./ucd-data` + absolute inputs (should be treated as relative via virtual filesystem boundary)
- Edge cases with relative basePath

2. **Absolute basePath Tests**

- `/absolute/path/to/ucd-data` + relative inputs
- `/absolute/path/to/ucd-data` + absolute inputs (should be treated as relative via virtual filesystem boundary)
- Edge cases with absolute basePath

3. **Security Tests** (in dedicated `test/security/` folder)

- **Node Bridge Security Tests** (in `test/security/node/`):
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
- **HTTP Bridge Security Tests** (in `test/security/http/`):
- Path traversal prevention with HTTP bridge (using `baseUrl.pathname` as basePath)
- URL-encoded traversal attacks (`%2e%2e%2f`, `%252e%252e%252f`, etc.)
- Boundary enforcement for different `baseUrl.pathname` configurations:
    - Shallow pathname: `/api/v1/files`
    - Deep pathname: `/api/v1/files/v16.0.0`
- Excessive encoding scenarios
- Mixed attack vectors (combined traversal and encoding)
- Use `mockFetch` from `#test-utils/msw` for HTTP mocking
- Verify actual HTTP requests made are correct
- **CRITICAL**: The security check happens AFTER normalization - final resolved path must be within basePath
- **Organize in dedicated `test/security/` folder for better discoverability and maintenance**
- **Add corresponding tests to path-utils** to verify resolveSafePath handles these scenarios correctly

4. **Edge Case Tests**

- Empty paths: `""`
- Root: `/` (should resolve to basePath)
- Current directory: `.` (should resolve to basePath)
- Parent directory: `..` (normalize and check - fail only if outside basePath)
- **Upward traversal within basePath**: `subdir/../file.txt` → Should work ✅
- **Upward traversal outside basePath**: `../../etc/passwd` → Should fail ❌
- Mixed separators
- Trailing slashes
- Multiple slashes
- **Add corresponding tests to path-utils** to verify resolveSafePath handles these edge cases correctly

5. **Bridge Method Tests**

- Test every method (`read`, `write`, `exists`, `listdir`, `mkdir`, `rm`)
- With every path scenario
- Verify correct behavior

6. **HTTP Bridge Tests**

- Verify baseUrl model works correctly
- Ensure security is maintained
- Handle differences from node bridge

### Phase 3: Identify and Document Issues

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
- If bugs are fixable → Proceed to Phase 5 (Fix Issues)
- **If fixing without API changes doesn't work** → Proceed to Phase 4 (Evaluate API Improvements) - **BUT MUST ASK FOR PERMISSION WITH CONCRETE EXAMPLE FIRST**

### Phase 4: Evaluate API Improvements (ONLY IF NEEDED)

**This phase only happens if Phase 3 reveals issues that cannot be fixed without API changesCRITICAL**: Before proceeding with API changes, you MUST:

1. **Ask for explicit permission** from the user
2. **Provide a very good concrete example** showing:

- The specific problem that cannot be fixed without API changes
- How the proposed API change solves it
- Before/after code examples
- Impact assessment (breaking changes, migration path, etc.)

1. **Evaluate API Design**

- Current: Methods take `path: string`, basePath is in closure
- Proposed: Methods take `basePath: string, path: string` separately
- Only consider if fixing without API changes doesn't solve the issue
- **Document the specific problem that requires API changes**

2. **Create Concrete Example for Permission Request**

- Show the exact issue that cannot be fixed without API changes
- Provide before/after code examples
- Demonstrate how API change solves the problem
- Show impact on existing code (breaking changes)
- Propose migration strategy

3. **Request Permission**

- Present the concrete example to the user
- Wait for explicit approval before proceeding
- If approved, proceed to implementation
- If not approved, find alternative solution

4. **Consider Implementation Options** (only if permission granted)

- Option A: Change method signatures to `read(basePath: string, path: string)`
- Option B: Keep current API but improve internal implementation
- Option C: Add overloads for backward compatibility
- Evaluate: Which is most maintainable? What's the migration path?

5. **Decision and Implementation** (only if permission granted)

- Only implement if absolutely necessary and permission granted
- Update all bridge implementations (node, http)
- **Update all test files** (this is critical - many test files will need changes)
- Update type definitions
- Ensure backward compatibility if possible

### Phase 5: Fix Issues

1. **Fix resolveSafePath if needed**

- Address any bugs found
- Ensure all scenarios work correctly
- Maintain security guarantees
- **Use path-utils package** - it's excellent! If changes are needed to make fs-bridge work better, make them in path-utils in a controlled way
- Ensure changes don't break existing path-utils consumers
- **Add comprehensive tests to path-utils** for any changes or new scenarios discovered
- Test all edge cases and security scenarios in path-utils test suite

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
- ✅ API remains unchanged (unless absolutely necessary)
- ✅ No regressions introduced

## Risk Mitigation

- **If approach doesn't work**: Pause, analyze, replan
- **If security issues found**: Fix immediately, don't proceed until secure
- **If too many edge cases**: Document them, handle systematically
- **If fixing without API changes doesn't work**: Only then evaluate API improvements as last resort
- **Maintainability is key**: Code should be easy to understand and modify in the future
- **path-utils changes**: If changes needed to path-utils, make them in a controlled way:
- Ensure changes don't break existing consumers
- Add comprehensive tests
- Document changes clearly
- Consider backward compatibility

## Files to Review/Modify

### path-utils package (add tests as needed):

1. `packages/path-utils/src/security.ts` - resolveSafePath implementation (may need controlled changes to support fs-bridge better)
2. `packages/path-utils/test/security.test.ts` - resolveSafePath tests (**add comprehensive tests for any scenarios discovered during verification**)
3. `packages/path-utils/test/security.unix.test.ts` - Unix-specific tests (add tests as needed)
4. `packages/path-utils/test/security.windows.test.ts` - Windows-specific tests (add tests as needed)

### fs-bridge package:

3. `packages/fs-bridge/src/bridges/node.ts` - Node bridge implementation
4. `packages/fs-bridge/src/bridges/http.ts` - HTTP bridge implementation
5. `packages/fs-bridge/src/define.ts` - Bridge definition and setup
6. `packages/fs-bridge/test/bridges/node.test.ts` - Node bridge tests
7. `packages/fs-bridge/test/bridges/http.test.ts` - HTTP bridge tests
8. `packages/fs-bridge/test/security/` - **NEW**: Dedicated security test folder

- **Node Bridge Security Tests** (`test/security/node/`):
- `path-traversal.test.ts` - Path traversal attack tests
- `encoded-attacks.test.ts` - Encoded attack vector tests
- `boundary-enforcement.test.ts` - Boundary enforcement tests
- `control-characters.test.ts` - Control character and null byte tests
- `unc-paths.test.ts` - UNC path tests (if applicable)
- `excessive-encoding.test.ts` - Excessive encoding tests
- `mixed-attacks.test.ts` - Combined attack vectors
- **HTTP Bridge Security Tests** (`test/security/http/`) - **TODO**:
- `path-traversal.test.ts` - Path traversal prevention with HTTP bridge
- `encoded-attacks.test.ts` - URL-encoded attack vectors
- `boundary-enforcement.test.ts` - Boundary enforcement for different baseUrl.pathname configurations
- `excessive-encoding.test.ts` - Excessive encoding scenarios