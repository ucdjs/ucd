# @ucdjs/path-utils

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/path-utils@0.1.0...@ucdjs/path-utils@0.2.0) (2025-11-16)

### Features

* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(path-utils): enhance path security and handling ([cf82cd37](https://github.com/ucdjs/ucd/commit/cf82cd37e6b631a7e8e13fee6b29292b3954fde9))
* feat(path-utils): enhance Windows path handling and validation ([1d04aeb1](https://github.com/ucdjs/ucd/commit/1d04aeb1e209aaa257ef62a1479ca87a1790afb8))
* feat(path-utils): export osPlatform for platform detection ([c94f9254](https://github.com/ucdjs/ucd/commit/c94f925406e9ff18c874cc3c6363ca7dc414411a))
* feat(path-utils): add WindowsPathBehaviorNotImplementedError for unimplemented behavior ([7cb4681b](https://github.com/ucdjs/ucd/commit/7cb4681b52a29e9e8e76b9660b88786f7c9aa90c))
* feat(path-utils): add isWindowsDrivePath and stripDriveLetter functions ([a1104df4](https://github.com/ucdjs/ucd/commit/a1104df47258b28a2ee93cf8eec0c467701346a3))
* feat(path-utils): enhance path resolution with error handling and validation ([b28fc513](https://github.com/ucdjs/ucd/commit/b28fc5132b849deb0e8880d16934235ed61ec6fc))
* feat(path-utils): add resolveSafePath function for path resolution and traversal prevention ([3bf4cbb5](https://github.com/ucdjs/ucd/commit/3bf4cbb542742b27dc8c0e60df1dc241891d0b44))
* feat(path-utils): add toUNCPosix function for converting Windows UNC paths to POSIX format ([47bb83cb](https://github.com/ucdjs/ucd/commit/47bb83cbe18cfbf780b8e663f8ae0ac301dab08a))
* feat(path-utils): add getAnyUNCRoot function and reorganize imports ([b0595d86](https://github.com/ucdjs/ucd/commit/b0595d86f17e0251bcc89747d667072f28dd8dd7))
* feat(path-utils): add constants for Windows path handling and enhance path conversion ([2dc9e07c](https://github.com/ucdjs/ucd/commit/2dc9e07c61f9063950b282ec332bc9b9cd417f8f))
* feat(path-utils): add missing error exports for path utilities ([83b38b51](https://github.com/ucdjs/ucd/commit/83b38b51584619f07f14c1463ab598544f9062de))
* feat(path-utils): add custom error classes for path traversal and Windows path issues ([ff098b7d](https://github.com/ucdjs/ucd/commit/ff098b7d9cf82f39633d09e4a37d76421a0834b0))
* feat(path-utils): add decodePathSafely function and update exports ([4070b806](https://github.com/ucdjs/ucd/commit/4070b806826546368f37b0f6ac1c41536b559efd))
* feat(path-utils): add custom error classes for path utilities ([044cd11d](https://github.com/ucdjs/ucd/commit/044cd11da10a88b9b03c276309c575b63981075e))
* feat(path-utils): add isWithinBase function for path validation ([974d929d](https://github.com/ucdjs/ucd/commit/974d929dbfcabaaf494376f222b3b247c09343c2))
* feat(path-utils): add isCaseSensitive utility ([11b4b5c1](https://github.com/ucdjs/ucd/commit/11b4b5c160261e22051592b264b7a0d87756413e))
* feat(path-utils): implement Windows path utilities ([09840fe5](https://github.com/ucdjs/ucd/commit/09840fe59d0c7171a770cda28050b26f959fea68))
* feat(path-utils): setup package ([f4e6cce5](https://github.com/ucdjs/ucd/commit/f4e6cce5864dc26efda2590f0882c8f3b58554d5))

### Bug Fixes

* fix(path-utils): normalize input path in resolveSafePath function ([49a4ccdd](https://github.com/ucdjs/ucd/commit/49a4ccdd750e5f1efe83f590dc372cf37ae06fa8))
* fix(path-utils): update CONTROL_CHARACTER_RE regex for accuracy ([6b4f43d9](https://github.com/ucdjs/ucd/commit/6b4f43d9dae6a5f8784d2b9123a4a3c87b88df24))
* fix(path-utils): improve path validation and normalization ([4ee30d5a](https://github.com/ucdjs/ucd/commit/4ee30d5a8df3b67e0bb38b28ca4006ec2c63fa0c))
* fix(path-utils): correct regex for stripping Windows drive letters ([c42629b3](https://github.com/ucdjs/ucd/commit/c42629b3902389c7f26809dce3a5b10664d6f13d))
* fix(path-utils): update logic to recognize forward-slash UNC paths ([14ff1f46](https://github.com/ucdjs/ucd/commit/14ff1f46a92e80fb010fc84369409f95ca54859b))
* fix(path-utils): update isUNCPath logic to use getAnyUNCRoot ([cbdb5457](https://github.com/ucdjs/ucd/commit/cbdb54573d088681a6e3056299f1308aae2b1ef1))
* fix(path-utils): improve path boundary checks in internal_resolveWindowsPath ([abf3806d](https://github.com/ucdjs/ucd/commit/abf3806dceb8022d6c452c419f4d14d8a8c67e53))
* fix(path-utils): improve UNC path handling in internal_resolveWindowsPath ([bb2327cf](https://github.com/ucdjs/ucd/commit/bb2327cf692b0941b5c697ae0e0f34d1dd0d9960))
* fix(path-utils): validate normalized paths within boundary ([f4fd13de](https://github.com/ucdjs/ucd/commit/f4fd13decce05975ffd5244ef06e7f209ae53f94))
* fix(path-utils): handle path decoding errors ([539d0a9d](https://github.com/ucdjs/ucd/commit/539d0a9db0f5b78ed69e0aa57a4246a4eaf26547))
* fix(path-utils): improve path resolution for case sensitivity ([03c732da](https://github.com/ucdjs/ucd/commit/03c732da97ecff240a827a2f881a4e3cfe810038))
* fix(path-utils): resolve Windows path normalization issue ([9ff80e37](https://github.com/ucdjs/ucd/commit/9ff80e3743eb1ff56ba38b84eb241d16c1a82069))
* fix(path-utils): simplify Windows path resolution ([42c7a398](https://github.com/ucdjs/ucd/commit/42c7a3987f7320afb17b467c3d97e944c655ddda))
* fix(path-utils): only normalize when both paths is windows drives ([92e2c495](https://github.com/ucdjs/ucd/commit/92e2c49563a400706822103d76ee2ab3adca990f))
* fix(path-utils): normalize base path in internal_resolveWindowsPath ([e3d5cd64](https://github.com/ucdjs/ucd/commit/e3d5cd64084b446237b1b2cada69c301a42f65cf))
* fix(path-utils): simplify Windows path resolution ([05d6907b](https://github.com/ucdjs/ucd/commit/05d6907b05e84e3429a1f83f882923d8465aa7e0))
* fix(path-utils): trim trailing slashes in toUnixFormat function ([9e7eff34](https://github.com/ucdjs/ucd/commit/9e7eff34e5bfbb639333f9c8afa6db93a29390d9))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* chore(tests): update import paths for test utilities ([0ceedd9b](https://github.com/ucdjs/ucd/commit/0ceedd9b1c35cba6a72e8af1edaa9612e2f1daee))
* chore(tests): update import paths for test utilities ([05725fc0](https://github.com/ucdjs/ucd/commit/05725fc0b3687ea717ee589fd71faf403e31727e))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* chore(path-utils): add debugging for UNC path rejection ([86d02edf](https://github.com/ucdjs/ucd/commit/86d02edf1c1ce3ca65727905c1279f6a52c04b3e))
* chore: add @ucdjs/shared as a workspace dependency ([80c1dc71](https://github.com/ucdjs/ucd/commit/80c1dc714aed0cff61d89d52972f5e5204248434))
* chore(path-utils): add debugging for path resolution functions ([fb9e5fc0](https://github.com/ucdjs/ucd/commit/fb9e5fc090b28c3d08c1d7246dc7c0683a8825b6))
* chore: add debug logs ([4efe78c1](https://github.com/ucdjs/ucd/commit/4efe78c19ebd2b5e75da57644c27e1b5e16b40b1))
* chore: revert ([94867eb8](https://github.com/ucdjs/ucd/commit/94867eb8fbf9be54b3b29e335639b7f5ed9cab37))
* chore: add side effects to pkg ([a53b587f](https://github.com/ucdjs/ucd/commit/a53b587fd4641a847f3d39d3a2f03531cc8ae91c))
* chore: fix windows test ([93a6be97](https://github.com/ucdjs/ucd/commit/93a6be972945dcf60c7d2d4c2f3a891f78d5e71f))
* chore: fix tests ([577e94cf](https://github.com/ucdjs/ucd/commit/577e94cf725142fbcedac597545678dc3da2268c))
* refactor(path-utils): swap parameters for consistency ([2264cfa4](https://github.com/ucdjs/ucd/commit/2264cfa423e235ce6191ad58823d14439bf1dada))
* chore: mark more functions as internal ([15c2789a](https://github.com/ucdjs/ucd/commit/15c2789a141cf886ee9ddb24bf36b5f20e162599))
* chore:  format ([6439bb50](https://github.com/ucdjs/ucd/commit/6439bb50580508a493f204b85be0d9de44661774))
* chore: format ([cfb02487](https://github.com/ucdjs/ucd/commit/cfb02487c71fea6b3d5beade095274fbdf3df512))
* chore: remove unused errors ([2b90173e](https://github.com/ucdjs/ucd/commit/2b90173eac0824d90fed7cad25df6932659a4e42))
* refactor(path-utils): remove unc support ([2c180272](https://github.com/ucdjs/ucd/commit/2c180272743923f156ce211c6a2e4cc845c5dfee))
* chore: try make windows tests work ([e6ee3632](https://github.com/ucdjs/ucd/commit/e6ee3632890e975bf9d991f9b60bd503487a3a88))
* chore: add debug ([b29be59b](https://github.com/ucdjs/ucd/commit/b29be59b38f383c33edea2ade96b0036799de74d))
* chore: fix debug ([72cee148](https://github.com/ucdjs/ucd/commit/72cee1489bbae212d6b4e4fbde149d50862b3e33))
* chore: debug ([fbc7a2fe](https://github.com/ucdjs/ucd/commit/fbc7a2fe935ef1f6b29e69ac43940968a604042f))
* chore: cleanup ([18e7c22d](https://github.com/ucdjs/ucd/commit/18e7c22d5b81eb959ca191d072278baed545e9dd))
* chore: cleanup ([8f90307c](https://github.com/ucdjs/ucd/commit/8f90307c36edd114cc22675ba23c1450dc99a99b))
* chore: fix more test cases ([26777a87](https://github.com/ucdjs/ucd/commit/26777a87db6b084f325d5fc62dbf39b70688d903))
* test(path-utils): update error type for UNC share mismatch ([3e76b312](https://github.com/ucdjs/ucd/commit/3e76b312b52a3f9dc3cae7ab2a88c073e78a8b77))
* chore: debug ([42f1eb11](https://github.com/ucdjs/ucd/commit/42f1eb113448cfa9322baa752b0689fffbcf31fe))
* chore: try fix ([dc6851b5](https://github.com/ucdjs/ucd/commit/dc6851b527f2b9fe3e66ac9313539afd44bc6b96))
* chore: add more debug ([ad43dd77](https://github.com/ucdjs/ucd/commit/ad43dd7791e917b88887429e9c385c43b554edb3))
* chore: try fix ([ba2ee092](https://github.com/ucdjs/ucd/commit/ba2ee0927650c6137c4b378142cee51393724658))
* chore: lint ([bd321008](https://github.com/ucdjs/ucd/commit/bd321008a8ba8e70a93b443271ecc58de795327b))
* chore: fix ([ede77704](https://github.com/ucdjs/ucd/commit/ede777044938cd7103801947c8f520d2b1dd098f))
* chore: add debug ([eadda20b](https://github.com/ucdjs/ucd/commit/eadda20b68355a850c4fd17e03636f178372fe05))
* test(path-utils): improve error messages for illegal characters in Windows paths ([907560b1](https://github.com/ucdjs/ucd/commit/907560b1999166885e47c5b3eef763ad613211b4))
* chore: fix issue with unix ([910b3c85](https://github.com/ucdjs/ucd/commit/910b3c85dd3ea7ed5baeb037dab227854d5c5dad))
* chore: lint ([be728b16](https://github.com/ucdjs/ucd/commit/be728b169bc1a93f13300ac37ebd10d39d031b25))
* chore: debug ([1a6246c9](https://github.com/ucdjs/ucd/commit/1a6246c96804eb5984cd12aa36e16f04ee5f467b))
* test(path-utils): enhance internal path resolution for Windows ([57a2b418](https://github.com/ucdjs/ucd/commit/57a2b418c57b607f976c7f78c2a34908fa898aab))
* chore: export more errors ([01f65c4b](https://github.com/ucdjs/ucd/commit/01f65c4bf3419c1f8756e659c73be2bf380d7896))
* test(path-utils): add tests for getAnyUNCRoot function ([10a958aa](https://github.com/ucdjs/ucd/commit/10a958aa5118b9b07990ba09b3aa4e5d93330884))
* test(path-utils): add toUnixFormat function for Windows path conversion ([3ec2c6e8](https://github.com/ucdjs/ucd/commit/3ec2c6e8c57abcd714dd4d8b112d6dd6b6f49330))
* test(path-utils): enhance path validation and add decodePathSafely function ([fc2fbc67](https://github.com/ucdjs/ucd/commit/fc2fbc6762c8800edfdc952f8163447f021fbc15))
* test(path-utils): add comprehensive tests for isWithinBase function ([892403d0](https://github.com/ucdjs/ucd/commit/892403d0206f820dd5f97f3dd4b2f33b9158f377))
* chore: add @luxass/utils dependency ([3b15e817](https://github.com/ucdjs/ucd/commit/3b15e817be92da5341bbdc40d70c20c042181e35))
* Merge branch 'path-utils' into implement-path-util-logic ([99af8586](https://github.com/ucdjs/ucd/commit/99af8586405b119e57d450593356bc5aa5d6447d))
* chore: format readme ([4325c3d7](https://github.com/ucdjs/ucd/commit/4325c3d7dd0210a34625c97cf005b0d912fcd5b0))
* chore: update readme ([f01c8a39](https://github.com/ucdjs/ucd/commit/f01c8a39e43dd54604d9f3b334ae2b7550c1d1de))


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
