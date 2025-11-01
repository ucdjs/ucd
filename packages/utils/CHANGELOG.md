# @ucdjs/utils

## 0.2.0

### Minor Changes

- [#212](https://github.com/ucdjs/ucd/pull/212) [`9ea1f81`](https://github.com/ucdjs/ucd/commit/9ea1f81ac649d06b8290edc0db0eb049988073fe) Thanks [@luxass](https://github.com/luxass)! - BREAKING: Remove most exports from @ucdjs/utils package

  Most utility functions have been moved to the internal `@ucdjs-internal/shared` package to better organize the monorepo's internal utilities. If you were using any of the removed functions, you can install `@ucdjs-internal/shared` directly, but note that this package is internal and may change without being marked as breaking changes.

  The `@ucdjs/utils` package now focuses on stable, user-facing utilities only.

- [#116](https://github.com/ucdjs/ucd/pull/116) [`4cb4b05`](https://github.com/ucdjs/ucd/commit/4cb4b0516173db402ee77d2ce1e9ed4e1923b359) Thanks [@luxass](https://github.com/luxass)! - feat: add `flattenFilePaths`

- [#68](https://github.com/ucdjs/ucd/pull/68) [`31f9791`](https://github.com/ucdjs/ucd/commit/31f9791d1775055cbc4794a2e923fd08713fc395) Thanks [@luxass](https://github.com/luxass)! - feat(utils): introduce `createFileSystem` factory + `FSAdapter` interface providing in-memory and custom VFS support

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#72](https://github.com/ucdjs/ucd/pull/72) [`731283e`](https://github.com/ucdjs/ucd/commit/731283e1eb5fdb3178ba4ce4c1713af3246b5955) Thanks [@luxass](https://github.com/luxass)! - feat(utils): enhance path filter functionality

  - Introduced `extend` and `patterns` methods to `PathFilter` for dynamic filter management.
  - Updated `createPathFilter` to return a `PathFilter` instead of a function type.
  - Refactored type references in related modules to use `PathFilter`.

- [#53](https://github.com/ucdjs/ucd/pull/53) [`8cd9a4c`](https://github.com/ucdjs/ucd/commit/8cd9a4c8a65128b142dccad1c532ef79c6fcbbc4) Thanks [@luxass](https://github.com/luxass)! - implement mirrorUCDFiles

- [#56](https://github.com/ucdjs/ucd/pull/56) [`7cc3df9`](https://github.com/ucdjs/ucd/commit/7cc3df9b6bde24fc0bc758e179e1169bb9003496) Thanks [@luxass](https://github.com/luxass)! - refactor ucd-files

- [#76](https://github.com/ucdjs/ucd/pull/76) [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9) Thanks [@luxass](https://github.com/luxass)! - improve store

- [#96](https://github.com/ucdjs/ucd/pull/96) [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03) Thanks [@luxass](https://github.com/luxass)! - move @ucdjs/utils/ucd-files into @ucdjs/ucd-store/ucd-files

- [#50](https://github.com/ucdjs/ucd/pull/50) [`cc16dd3`](https://github.com/ucdjs/ucd/commit/cc16dd3f4af7a78ced58d74f7f3a265fc75af9a4) Thanks [@luxass](https://github.com/luxass)! - implement fs-adapter for usage in mirrorUCDFiles

- [#75](https://github.com/ucdjs/ucd/pull/75) [`59dee88`](https://github.com/ucdjs/ucd/commit/59dee88baa6ab3ce936ef293c4733dc8a8d2fe26) Thanks [@luxass](https://github.com/luxass)! - feat: export constants

- [#55](https://github.com/ucdjs/ucd/pull/55) [`99ac908`](https://github.com/ucdjs/ucd/commit/99ac908c0f8c79ddb214661da3888b07b725cd69) Thanks [@luxass](https://github.com/luxass)! - feat: add validateUCDFiles function and update FSAdapter interface with exists and readdir methods

- [#74](https://github.com/ucdjs/ucd/pull/74) [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55) Thanks [@luxass](https://github.com/luxass)! - Enhanced path filtering with extendable filters and temporary filter support.

  ```typescript
  const filter = createPathFilter(["*.txt"]);
  filter.extend(["!*Test*"]); // Add more patterns
  filter("file.js", ["*.js"]); // Use extra filters temporarily
  ```

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0

## 0.1.0

### Minor Changes

- [#29](https://github.com/ucdjs/ucd/pull/29) [`11095da`](https://github.com/ucdjs/ucd/commit/11095da0d51bfc3b1ca3a5a23d2b826e3c5e2fd3) Thanks [@luxass](https://github.com/luxass)! - feat: add safe json parse
