---
"@ucdjs/path-utils": patch
---

Fix path resolution by using `pathe.normalize` instead of `pathe.resolve` for input path processing.

This change fixes an issue in the `resolveSafePath` function where `pathe.resolve` was incorrectly resolving relative paths against the current working directory instead of preserving them as-is for later processing.

**Before:**
```ts
const absoluteInputPath = pathe.resolve(decodedPath);
```

**After:**
```ts
const absoluteInputPath = pathe.normalize(decodedPath);
```

**Why this matters:**
- `pathe.resolve()` converts relative paths to absolute paths based on the current working directory
- `pathe.normalize()` only cleans up the path (removes `.` and `..` segments) without changing relative paths to absolute
- This ensures proper path validation logic where we need to distinguish between truly absolute input paths vs relative ones that should be resolved against the base path

**Example behavior change:**
```ts
// Input: "../secret.txt" from working directory "/tmp"
// Before: pathe.resolve("../secret.txt") → "/secret.txt" (absolute)
// After:  pathe.normalize("../secret.txt") → "../secret.txt" (still relative)
```

This fix ensures that relative paths are handled correctly through the proper resolution logic later in the function.
