# @ucdjs/fs-bridge

## 0.1.0

### Minor Changes

- [#181](https://github.com/ucdjs/ucd/pull/181) [`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4) Thanks [@luxass](https://github.com/luxass)! - Reimplement the Node.js File System Bridge with enhanced path handling and safety checks.

- [#189](https://github.com/ucdjs/ucd/pull/189) [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39) Thanks [@luxass](https://github.com/luxass)! - add `BridgeUnsupportedOperation` error

- [#241](https://github.com/ucdjs/ucd/pull/241) [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119) Thanks [@luxass](https://github.com/luxass)! - Migrate fs-bridge to use the new @ucdjs/path-utils package for improved path handling and safety.

  This change removes the local path utility functions and leverages the centralized path-utils package instead:

  **Before:**

  ```ts
  import { resolveSafePath } from "./utils";
  // Local BridgePathTraversal error class
  ```

  **After:**

  ```ts
  import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
  // Uses centralized path utilities and error handling
  ```

  **Key changes:**

  - Removed local `utils.ts` file with `resolveSafePath` and `isWithinBase` functions
  - Added `@ucdjs/path-utils` as a dependency
  - Updated imports to use the centralized path utilities
  - Removed `BridgePathTraversal` error class in favor of path-utils error handling
  - Enhanced error handling to catch `PathUtilsBaseError` instances
  - Added `BridgeSetupError` for better error handling during bridge setup

- [#212](https://github.com/ucdjs/ucd/pull/212) [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35) Thanks [@luxass](https://github.com/luxass)! - feat: migrate from @ucdjs/utils to @ucdjs-internal/shared

  Updated internal imports to use `@ucdjs-internal/shared` instead of `@ucdjs/utils` for utilities like `safeJsonParse` and other shared patterns. This aligns with the new package structure where `@ucdjs-internal/shared` contains internal utilities and `@ucdjs/utils` focuses on public-facing utilities.

- [#228](https://github.com/ucdjs/ucd/pull/228) [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d) Thanks [@luxass](https://github.com/luxass)! - feat: add custom fs-bridge errors

  Adds four new custom error classes for better error handling in the fs-bridge:

  - `BridgeGenericError`: For wrapping unexpected errors with optional original error reference
  - `BridgePathTraversal`: For path traversal security violations when accessing files outside allowed scope
  - `BridgeFileNotFound`: For file or directory not found errors
  - `BridgeEntryIsDir`: For cases where a file is expected but a directory is found

  ```typescript
  import { BridgeFileNotFound, BridgePathTraversal } from "@ucdjs/fs-bridge";

  // Example usage in bridge implementations
  try {
    await fsp.readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new BridgeFileNotFound(path);
    }
    throw new BridgeGenericError("Unexpected file system error", error);
  }
  ```

- [#69](https://github.com/ucdjs/ucd/pull/69) [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec) Thanks [@luxass](https://github.com/luxass)! - feat: add fs-bridge module with Node.js, HTTP, and default export variants

  The fs-bridge is now available via three import paths:

  - `@ucdjs/fs-bridge/bridges/node` (Node.js version)
  - `@ucdjs/fs-bridge/bridges/http` (HTTP version)
  - `@ucdjs/fs-bridge` (default version)

- [#306](https://github.com/ucdjs/ucd/pull/306) [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3) Thanks [@luxass](https://github.com/luxass)! - Add support for metadata on fs-bridges

- [#229](https://github.com/ucdjs/ucd/pull/229) [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3) Thanks [@luxass](https://github.com/luxass)! - feat: add error handling wrapper to fs-bridge operations

  Wraps all fs-bridge operation methods with automatic error handling to improve error management:

  - **Preserves custom bridge errors**: Re-throws `BridgeBaseError` instances (like `BridgePathTraversal`, `BridgeFileNotFound`) directly
  - **Wraps unexpected errors**: Converts unknown/system errors into `BridgeGenericError` with operation context
  - **Transparent to implementations**: Bridge implementations don't need to change - error handling is applied automatically

  ```typescript
  import {
    defineFileSystemBridge,
    BridgeFileNotFound,
    BridgeGenericError,
  } from "@ucdjs/fs-bridge";

  const bridgeCreator = defineFileSystemBridge({
    setup() {
      return {
        async read(path) {
          // If this throws a custom bridge error, it's re-thrown as-is
          if (!pathExists(path)) {
            throw new BridgeFileNotFound(path);
          }

          // If this throws an unexpected error (like network timeout),
          // it gets wrapped in BridgeGenericError with context
          return await fetchFile(path);
        },
      };
    },
  });

  const bridge = bridgeCreator();

  // Usage - all errors are now consistently handled
  try {
    await bridge.read("/some/path");
  } catch (error) {
    if (error instanceof BridgeFileNotFound) {
      // Handle specific bridge error
    } else if (error instanceof BridgeGenericError) {
      // Handle wrapped unexpected error
      console.log(error.originalError); // Access the original error
    }
  }
  ```

- [#189](https://github.com/ucdjs/ucd/pull/189) [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b) Thanks [@luxass](https://github.com/luxass)! - rewrite fs-bridge capabilities

- [#175](https://github.com/ucdjs/ucd/pull/175) [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3) Thanks [@luxass](https://github.com/luxass)! - feat: handle security in node filesystem bridge

  This will disallow path traversal attacks and prevent access to critical system paths.

- [#160](https://github.com/ucdjs/ucd/pull/160) [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f) Thanks [@luxass](https://github.com/luxass)! - feat!: migrate fs-bridge from utils to fs-bridge package

- [#187](https://github.com/ucdjs/ucd/pull/187) [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61) Thanks [@luxass](https://github.com/luxass)! - refactor capability code

- [#230](https://github.com/ucdjs/ucd/pull/230) [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234) Thanks [@luxass](https://github.com/luxass)! - feat: add path traversal utilities to bridge setup context

  Adds shared utility functions to the bridge setup context for consistent path security:

  - **`resolveSafePath(basePath, inputPath)`**: Safely resolves paths while preventing traversal attacks
  - **`isWithinBase(resolvedPath, basePath)`**: Checks if a path is within an allowed base directory

  Both utilities work for file system paths (Node bridge) and URL paths (HTTP bridge) by treating URL pathnames as base paths.

  ```typescript
  import { defineFileSystemBridge } from "@ucdjs/fs-bridge";

  const bridge = defineFileSystemBridge({
    optionsSchema: z.object({ basePath: z.string() }),
    setup({ options, resolveSafePath }) {
      const basePath = resolve(options.basePath);

      return {
        async read(path) {
          // Automatically prevents path traversal - throws BridgePathTraversal if unsafe
          const safePath = resolveSafePath(basePath, path);
          return readFile(safePath);
        },
      };
    },
  });

  // For HTTP bridges, URL pathname is used as base path:
  const httpBridge = defineFileSystemBridge({
    setup({ options, resolveSafePath }) {
      const baseUrl = new URL(options.baseUrl);
      const basePath = baseUrl.pathname; // e.g., "/api/v1/files"

      return {
        async read(path) {
          // Prevents escaping API endpoint: "../admin" → BridgePathTraversal
          const safePath = resolveSafePath(basePath, path);
          const url = new URL(safePath, baseUrl.origin);
          return fetch(url).then((r) => r.text());
        },
      };
    },
  });
  ```

### Patch Changes

- [#301](https://github.com/ucdjs/ucd/pull/301) [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69) Thanks [@luxass](https://github.com/luxass)! - infer bridge option schema as never, if not provided

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`e612985`](https://github.com/ucdjs/ucd/commit/e612985209ff4e62fbfba418621a029d000b4b01), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`2d8f1b9`](https://github.com/ucdjs/ucd/commit/2d8f1b90f453b95c0cd4ac95aec67e028fc74e03)]:
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/path-utils@0.1.0
  - @ucdjs/schemas@0.1.0
