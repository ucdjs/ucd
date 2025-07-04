# @ucdjs/utils

## 0.2.0

### Minor Changes

- [#68](https://github.com/ucdjs/ucd/pull/68) [`31f9791`](https://github.com/ucdjs/ucd/commit/31f9791d1775055cbc4794a2e923fd08713fc395) Thanks [@luxass](https://github.com/luxass)! - feat(utils): introduce `createFileSystem` factory + `FSAdapter` interface providing in-memory and custom VFS support

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#72](https://github.com/ucdjs/ucd/pull/72) [`731283e`](https://github.com/ucdjs/ucd/commit/731283e1eb5fdb3178ba4ce4c1713af3246b5955) Thanks [@luxass](https://github.com/luxass)! - feat(utils): enhance path filter functionality

  - Introduced `extend` and `patterns` methods to `PathFilter` for dynamic filter management.
  - Updated `createPathFilter` to return a `PathFilter` instead of a function type.
  - Refactored type references in related modules to use `PathFilter`.

- [#69](https://github.com/ucdjs/ucd/pull/69) [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec) Thanks [@luxass](https://github.com/luxass)! - feat: add fs-bridge module with Node.js, HTTP, and default export variants

  The fs-bridge is now available via three import paths:

  - `@ucdjs/utils/fs-bridge/node` (Node.js version)
  - `@ucdjs/utils/fs-bridge/http` (HTTP version)
  - `@ucdjs/utils/fs-bridge` (default version)

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

- Updated dependencies [[`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976)]:
  - @ucdjs/env@0.1.0
  - @ucdjs/fetch@0.1.0

## 0.1.0

### Minor Changes

- [#29](https://github.com/ucdjs/ucd/pull/29) [`11095da`](https://github.com/ucdjs/ucd/commit/11095da0d51bfc3b1ca3a5a23d2b826e3c5e2fd3) Thanks [@luxass](https://github.com/luxass)! - feat: add safe json parse
