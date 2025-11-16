# @ucdjs/path-utils

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/path-utils@0.1.0...@ucdjs/path-utils@0.2.0) (2025-11-16)

### Features

* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by Lucas)
* enhance path security and handling ([cf82cd37](https://github.com/ucdjs/ucd/commit/cf82cd37e6b631a7e8e13fee6b29292b3954fde9)) (by Lucas)
* enhance Windows path handling and validation ([1d04aeb1](https://github.com/ucdjs/ucd/commit/1d04aeb1e209aaa257ef62a1479ca87a1790afb8)) (by Lucas)
* export osPlatform for platform detection ([c94f9254](https://github.com/ucdjs/ucd/commit/c94f925406e9ff18c874cc3c6363ca7dc414411a)) (by Lucas)
* add WindowsPathBehaviorNotImplementedError for unimplemented behavior ([7cb4681b](https://github.com/ucdjs/ucd/commit/7cb4681b52a29e9e8e76b9660b88786f7c9aa90c)) (by Lucas)
* add isWindowsDrivePath and stripDriveLetter functions ([a1104df4](https://github.com/ucdjs/ucd/commit/a1104df47258b28a2ee93cf8eec0c467701346a3)) (by Lucas)
* enhance path resolution with error handling and validation ([b28fc513](https://github.com/ucdjs/ucd/commit/b28fc5132b849deb0e8880d16934235ed61ec6fc)) (by Lucas)
* add resolveSafePath function for path resolution and traversal prevention ([3bf4cbb5](https://github.com/ucdjs/ucd/commit/3bf4cbb542742b27dc8c0e60df1dc241891d0b44)) (by Lucas)
* add toUNCPosix function for converting Windows UNC paths to POSIX format ([47bb83cb](https://github.com/ucdjs/ucd/commit/47bb83cbe18cfbf780b8e663f8ae0ac301dab08a)) (by Lucas)
* add getAnyUNCRoot function and reorganize imports ([b0595d86](https://github.com/ucdjs/ucd/commit/b0595d86f17e0251bcc89747d667072f28dd8dd7)) (by Lucas)
* add constants for Windows path handling and enhance path conversion ([2dc9e07c](https://github.com/ucdjs/ucd/commit/2dc9e07c61f9063950b282ec332bc9b9cd417f8f)) (by Lucas)
* add missing error exports for path utilities ([83b38b51](https://github.com/ucdjs/ucd/commit/83b38b51584619f07f14c1463ab598544f9062de)) (by Lucas)
* add custom error classes for path traversal and Windows path issues ([ff098b7d](https://github.com/ucdjs/ucd/commit/ff098b7d9cf82f39633d09e4a37d76421a0834b0)) (by Lucas)
* add decodePathSafely function and update exports ([4070b806](https://github.com/ucdjs/ucd/commit/4070b806826546368f37b0f6ac1c41536b559efd)) (by Lucas)
* add custom error classes for path utilities ([044cd11d](https://github.com/ucdjs/ucd/commit/044cd11da10a88b9b03c276309c575b63981075e)) (by Lucas)
* add isWithinBase function for path validation ([974d929d](https://github.com/ucdjs/ucd/commit/974d929dbfcabaaf494376f222b3b247c09343c2)) (by Lucas)
* add isCaseSensitive utility ([11b4b5c1](https://github.com/ucdjs/ucd/commit/11b4b5c160261e22051592b264b7a0d87756413e)) (by Lucas)
* implement Windows path utilities ([09840fe5](https://github.com/ucdjs/ucd/commit/09840fe59d0c7171a770cda28050b26f959fea68)) (by Lucas)
* setup package ([f4e6cce5](https://github.com/ucdjs/ucd/commit/f4e6cce5864dc26efda2590f0882c8f3b58554d5)) (by Lucas)

### Refactoring

* update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)) (by Lucas)
* update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)) (by Lucas)
* swap parameters for consistency ([2264cfa4](https://github.com/ucdjs/ucd/commit/2264cfa423e235ce6191ad58823d14439bf1dada)) (by Lucas)
* remove unc support ([2c180272](https://github.com/ucdjs/ucd/commit/2c180272743923f156ce211c6a2e4cc845c5dfee)) (by Lucas)

### Bug Fixes

* normalize input path in resolveSafePath function ([49a4ccdd](https://github.com/ucdjs/ucd/commit/49a4ccdd750e5f1efe83f590dc372cf37ae06fa8)) (by Lucas)
* update CONTROL_CHARACTER_RE regex for accuracy ([6b4f43d9](https://github.com/ucdjs/ucd/commit/6b4f43d9dae6a5f8784d2b9123a4a3c87b88df24)) (by Lucas)
* improve path validation and normalization ([4ee30d5a](https://github.com/ucdjs/ucd/commit/4ee30d5a8df3b67e0bb38b28ca4006ec2c63fa0c)) (by Lucas)
* correct regex for stripping Windows drive letters ([c42629b3](https://github.com/ucdjs/ucd/commit/c42629b3902389c7f26809dce3a5b10664d6f13d)) (by Lucas)
* update logic to recognize forward-slash UNC paths ([14ff1f46](https://github.com/ucdjs/ucd/commit/14ff1f46a92e80fb010fc84369409f95ca54859b)) (by Lucas)
* update isUNCPath logic to use getAnyUNCRoot ([cbdb5457](https://github.com/ucdjs/ucd/commit/cbdb54573d088681a6e3056299f1308aae2b1ef1)) (by Lucas)
* improve path boundary checks in internal_resolveWindowsPath ([abf3806d](https://github.com/ucdjs/ucd/commit/abf3806dceb8022d6c452c419f4d14d8a8c67e53)) (by Lucas)
* improve UNC path handling in internal_resolveWindowsPath ([bb2327cf](https://github.com/ucdjs/ucd/commit/bb2327cf692b0941b5c697ae0e0f34d1dd0d9960)) (by Lucas)
* validate normalized paths within boundary ([f4fd13de](https://github.com/ucdjs/ucd/commit/f4fd13decce05975ffd5244ef06e7f209ae53f94)) (by Lucas)
* handle path decoding errors ([539d0a9d](https://github.com/ucdjs/ucd/commit/539d0a9db0f5b78ed69e0aa57a4246a4eaf26547)) (by Lucas)
* improve path resolution for case sensitivity ([03c732da](https://github.com/ucdjs/ucd/commit/03c732da97ecff240a827a2f881a4e3cfe810038)) (by Lucas)
* resolve Windows path normalization issue ([9ff80e37](https://github.com/ucdjs/ucd/commit/9ff80e3743eb1ff56ba38b84eb241d16c1a82069)) (by Lucas)
* simplify Windows path resolution ([42c7a398](https://github.com/ucdjs/ucd/commit/42c7a3987f7320afb17b467c3d97e944c655ddda)) (by Lucas)
* only normalize when both paths is windows drives ([92e2c495](https://github.com/ucdjs/ucd/commit/92e2c49563a400706822103d76ee2ab3adca990f)) (by Lucas)
* normalize base path in internal_resolveWindowsPath ([e3d5cd64](https://github.com/ucdjs/ucd/commit/e3d5cd64084b446237b1b2cada69c301a42f65cf)) (by Lucas)
* simplify Windows path resolution ([05d6907b](https://github.com/ucdjs/ucd/commit/05d6907b05e84e3429a1f83f882923d8465aa7e0)) (by Lucas)
* trim trailing slashes in toUnixFormat function ([9e7eff34](https://github.com/ucdjs/ucd/commit/9e7eff34e5bfbb639333f9c8afa6db93a29390d9)) (by Lucas)

### Miscellaneous

* Merge branch 'path-utils' into implement-path-util-logic ([99af8586](https://github.com/ucdjs/ucd/commit/99af8586405b119e57d450593356bc5aa5d6447d)) (by Lucas Nørgård)


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
