# @ucdjs/path-utils

# Changelog

{{releases}}


## 0.1.0

### Minor Changes

- [#238](https://github.com/ucdjs/ucd/pull/238) [`e612985`](https://github.com/ucdjs/ucd/commit/e612985209ff4e62fbfba418621a029d000b4b01) Thanks [@luxass](https://github.com/luxass)! - Add comprehensive path utilities with security-focused path resolution

  This release introduces a new path utilities package with cross-platform path handling, Windows-specific utilities, and secure path resolution functionality.

  ## New Functions

  ### Security Functions

  - **`resolveSafePath(basePath, inputPath)`** - Resolves paths within secure boundaries, preventing traversal attacks
  - **`decodePathSafely(encodedPath)`** - Safely decodes URL-encoded paths with infinite loop protection
  - **`isWithinBase(basePath, resolvedPath)`** - Checks if a resolved path stays within a base directory

  ### Platform Functions

  - **`getWindowsDriveLetter(path)`** - Extracts drive letter from Windows paths
  - **`isWindowsDrivePath(path)`** / **`isUNCPath(path)`** - Path type detection
  - **`stripDriveLetter(path)`** - Removes drive letter from paths
  - **`toUnixFormat(path)`** - Path format conversion
  - **`assertNotUNCPath(path)`** - Asserts that a path is not a UNC path, throws error if it is

  ### Utility Functions

  - **`isCaseSensitive`** - Detects filesystem case sensitivity
  - **`osPlatform`** - Current operating system platform

  ## Security Features

  - **Path traversal prevention** - Blocks `../` and encoded traversal attempts
  - **UNC path rejection** - Rejects Windows UNC network paths for security
  - **Multi-layer encoding protection** - Handles nested URL encoding safely
  - **Control character filtering** - Rejects null bytes and illegal characters
  - **Cross-platform boundary enforcement** - Consistent security across OS platforms

  ## resolveSafePath Examples

  ### Basic Virtual Filesystem

  ```js
  import { resolveSafePath } from "@ucdjs/path-utils";

  // Create secure boundary
  const boundary = "/home/user/app-data";

  // Safe resolution within boundary
  resolveSafePath(boundary, "config.json"); // → '/home/user/app-data/config.json'
  resolveSafePath(boundary, "files/document.pdf"); // → '/home/user/app-data/files/document.pdf'
  resolveSafePath(boundary, "/logs/app.log"); // → '/home/user/app-data/logs/app.log'

  // Blocked traversal attempts
  resolveSafePath(boundary, "../../../etc/passwd"); // ❌ PathTraversalError
  resolveSafePath(boundary, "%2e%2e/secrets"); // ❌ PathTraversalError
  ```

  ### Windows Path Support

  ```js
  // Windows drive paths
  resolveSafePath("C:\\Projects\\MyApp", "data\\users.db"); // → 'C:/Projects/MyApp/data/users.db'
  resolveSafePath("C:\\Projects\\MyApp", "D:\\external.txt"); // ❌ WindowsDriveMismatchError

  // UNC network paths are rejected for security
  resolveSafePath("C:\\Projects\\MyApp", "\\\\server\\share\\file.txt"); // ❌ UNCPathNotSupportedError
  toUnixFormat("\\\\server\\share\\documents"); // ❌ UNCPathNotSupportedError
  ```

  ### Encoding Attack Protection

  ```js
  // Safe decoding
  resolveSafePath("/base", "file%20name.txt"); // → '/base/file name.txt'
  resolveSafePath("/base", "path%2Fto%2Ffile"); // → '/base/path/to/file'

  // Attack prevention
  resolveSafePath("/base", maliciouslyEncodedInput); // ❌ FailedToDecodePathError
  resolveSafePath("/base", "file\0.txt"); // ❌ IllegalCharacterInPathError
  ```

  This package is ideal for web servers, file upload systems, containerized applications, and any scenario requiring secure path resolution within defined boundaries.

### Patch Changes

- [#241](https://github.com/ucdjs/ucd/pull/241) [`2d8f1b9`](https://github.com/ucdjs/ucd/commit/2d8f1b90f453b95c0cd4ac95aec67e028fc74e03) Thanks [@luxass](https://github.com/luxass)! - Fix path resolution by using `pathe.normalize` instead of `pathe.resolve` for input path processing.

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

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0
