# @ucdjs/ucd-store

## 0.1.0

### Minor Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#174](https://github.com/ucdjs/ucd/pull/174) [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741) Thanks [@luxass](https://github.com/luxass)! - refactor: rewrite ucd store to be more modular

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#44](https://github.com/ucdjs/ucd/pull/44) [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946) Thanks [@luxass](https://github.com/luxass)! - simplify preconfigured filters

- [#206](https://github.com/ucdjs/ucd/pull/206) [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861) Thanks [@luxass](https://github.com/luxass)! - Implement Repair operation for UCD Store

- [#212](https://github.com/ucdjs/ucd/pull/212) [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35) Thanks [@luxass](https://github.com/luxass)! - feat: migrate from @ucdjs/utils to @ucdjs/shared

  Updated internal imports to use `@ucdjs/shared` instead of `@ucdjs/utils` for utilities like `safeJsonParse` and other shared patterns. This aligns with the new package structure where `@ucdjs/shared` contains internal utilities and `@ucdjs/utils` focuses on public-facing utilities.

- [#209](https://github.com/ucdjs/ucd/pull/209) [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f) Thanks [@luxass](https://github.com/luxass)! - Store operations now return a result wrapper for improved error handling/reporting.

  ## What changed

  - All core operations (analyze, mirror, clean, repair) now return:
    - `{ success: boolean; data?: TData; errors: StoreError[] }`
    - On failures, `data` is undefined; on success, `data` is present.
  - Structured, serializable error payloads via `UCDStoreBaseError` → `StoreError` union.
  - Init options renamed: `StoreInitOptions` → `InitOptions` (re-exported).
  - `UCDStoreUnsupportedFeature` is an alias to `UCDStoreBridgeUnsupportedOperation`.

  ## Migration

  - Update call sites to read `result.success` and `result.data` instead of bare arrays.
  - Handle `result.errors` instead of catching thrown errors for operation failures.
  - If you referenced `StoreInitOptions`, switch to `InitOptions`.

  ## Notes

  - Concurrency validations return `{ success: false, data: undefined, errors: [...] }`.
  - Not-initialized scenarios no longer throw; they return `{ success: false, data: undefined, errors: [{ type: "NOT_INITIALIZED", ... }] }`.

- [#43](https://github.com/ucdjs/ucd/pull/43) [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea) Thanks [@luxass](https://github.com/luxass)! - support setting fs on local stores

- [#42](https://github.com/ucdjs/ucd/pull/42) [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0) Thanks [@luxass](https://github.com/luxass)! - implement filtering

- [#25](https://github.com/ucdjs/ucd/pull/25) [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12) Thanks [@luxass](https://github.com/luxass)! - implement ucd-store with local & remote functionality

- [#41](https://github.com/ucdjs/ucd/pull/41) [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e) Thanks [@luxass](https://github.com/luxass)! - rename filters to filterPatterns for consistency across UCDStore interfaces and implementations

- [#183](https://github.com/ucdjs/ucd/pull/183) [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1) Thanks [@luxass](https://github.com/luxass)! - implement analyze on ucd-store

- [#206](https://github.com/ucdjs/ucd/pull/206) [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861) Thanks [@luxass](https://github.com/luxass)! - Change analyze's return type to be `AnalyzeResult` instead of `VersionAnalysis`

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

- [#189](https://github.com/ucdjs/ucd/pull/189) [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39) Thanks [@luxass](https://github.com/luxass)! - drop support for store capabilities, and utilize fs capabilities better

- [#76](https://github.com/ucdjs/ucd/pull/76) [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9) Thanks [@luxass](https://github.com/luxass)! - improve store

- [#96](https://github.com/ucdjs/ucd/pull/96) [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03) Thanks [@luxass](https://github.com/luxass)! - move @ucdjs/utils/ucd-files into @ucdjs/ucd-store/ucd-files

- [#187](https://github.com/ucdjs/ucd/pull/187) [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61) Thanks [@luxass](https://github.com/luxass)! - refactor capability code

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- [#218](https://github.com/ucdjs/ucd/pull/218) [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f) Thanks [@luxass](https://github.com/luxass)! - drop `toStoreError` function on Store Runtime Errors

- [#34](https://github.com/ucdjs/ucd/pull/34) [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40) Thanks [@luxass](https://github.com/luxass)! - feat: switch to picomatch

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#74](https://github.com/ucdjs/ucd/pull/74) [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55) Thanks [@luxass](https://github.com/luxass)! - Enhanced path filtering with extendable filters and temporary filter support.

  ```typescript
  const filter = createPathFilter(["*.txt"]);
  filter.extend(["!*Test*"]); // Add more patterns
  filter("file.js", ["*.js"]); // Use extra filters temporarily
  ```

- Updated dependencies [[`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234)]:
  - @ucdjs/fs-bridge@0.1.0
  - @ucdjs/fetch@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/shared@0.1.0
  - @ucdjs/schemas@0.1.0

## 0.0.1

### Patch Changes

- [#20](https://github.com/ucdjs/ucd/pull/20) [`5d804e3`](https://github.com/ucdjs/ucd/commit/5d804e31b1d6e36cb69f7a1de0722995355b5bf1) Thanks [@luxass](https://github.com/luxass)! - add initial ucd-store package
