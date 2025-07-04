# @ucdjs/ucd-store

## 0.1.0

### Minor Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#44](https://github.com/ucdjs/ucd/pull/44) [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946) Thanks [@luxass](https://github.com/luxass)! - simplify preconfigured filters

- [#43](https://github.com/ucdjs/ucd/pull/43) [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea) Thanks [@luxass](https://github.com/luxass)! - support setting fs on local stores

- [#42](https://github.com/ucdjs/ucd/pull/42) [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0) Thanks [@luxass](https://github.com/luxass)! - implement filtering

- [#25](https://github.com/ucdjs/ucd/pull/25) [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12) Thanks [@luxass](https://github.com/luxass)! - implement ucd-store with local & remote functionality

- [#41](https://github.com/ucdjs/ucd/pull/41) [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e) Thanks [@luxass](https://github.com/luxass)! - rename filters to filterPatterns for consistency across UCDStore interfaces and implementations

- [#76](https://github.com/ucdjs/ucd/pull/76) [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9) Thanks [@luxass](https://github.com/luxass)! - improve store

- [#96](https://github.com/ucdjs/ucd/pull/96) [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03) Thanks [@luxass](https://github.com/luxass)! - move @ucdjs/utils/ucd-files into @ucdjs/ucd-store/ucd-files

### Patch Changes

- [#34](https://github.com/ucdjs/ucd/pull/34) [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40) Thanks [@luxass](https://github.com/luxass)! - feat: switch to picomatch

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#74](https://github.com/ucdjs/ucd/pull/74) [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55) Thanks [@luxass](https://github.com/luxass)! - Enhanced path filtering with extendable filters and temporary filter support.

  ```typescript
  const filter = createPathFilter(["*.txt"]);
  filter.extend(["!*Test*"]); // Add more patterns
  filter("file.js", ["*.js"]); // Use extra filters temporarily
  ```

- Updated dependencies [[`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`31f9791`](https://github.com/ucdjs/ucd/commit/31f9791d1775055cbc4794a2e923fd08713fc395), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`731283e`](https://github.com/ucdjs/ucd/commit/731283e1eb5fdb3178ba4ce4c1713af3246b5955), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`8cd9a4c`](https://github.com/ucdjs/ucd/commit/8cd9a4c8a65128b142dccad1c532ef79c6fcbbc4), [`7cc3df9`](https://github.com/ucdjs/ucd/commit/7cc3df9b6bde24fc0bc758e179e1169bb9003496), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`cc16dd3`](https://github.com/ucdjs/ucd/commit/cc16dd3f4af7a78ced58d74f7f3a265fc75af9a4), [`59dee88`](https://github.com/ucdjs/ucd/commit/59dee88baa6ab3ce936ef293c4733dc8a8d2fe26), [`99ac908`](https://github.com/ucdjs/ucd/commit/99ac908c0f8c79ddb214661da3888b07b725cd69), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/env@0.1.0
  - @ucdjs/utils@0.2.0
  - @ucdjs/fetch@0.1.0

## 0.0.1

### Patch Changes

- [#20](https://github.com/ucdjs/ucd/pull/20) [`5d804e3`](https://github.com/ucdjs/ucd/commit/5d804e31b1d6e36cb69f7a1de0722995355b5bf1) Thanks [@luxass](https://github.com/luxass)! - add initial ucd-store package
