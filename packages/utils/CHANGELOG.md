# @ucdjs/utils

## [0.2.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/utils@0.2.0...@ucdjs/utils@0.2.1-beta.0) (2026-02-15)


### 🚀 Features
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f)) (by [@luxass](https://github.com/luxass))
* implement recursive directory listing in HTTPFileSystemBridge ([b3ee5dd3](https://github.com/ucdjs/ucd/commit/b3ee5dd3165c3d96166c895afae773f020374f10)) (by [@luxass](https://github.com/luxass))
* enhance listdir functionality with recursive support ([7db08f77](https://github.com/ucdjs/ucd/commit/7db08f7739fcfb92b5594a468a0735afe716e930)) (by [@luxass](https://github.com/luxass))
* add flattenFilePaths function to recursively flatten file structures ([da32ab48](https://github.com/ucdjs/ucd/commit/da32ab48388d9c88f57af22e080bd0933e5212ca)) (by [@luxass](https://github.com/luxass))
* add tests for mirrorUCDFiles and validateUCDFiles functions ([3214f78e](https://github.com/ucdjs/ucd/commit/3214f78eeb246cdf86799834e8993c0ca4f98d9e)) (by [@luxass](https://github.com/luxass))
* add environment package with configuration and validation utilities ([2743f549](https://github.com/ucdjs/ucd/commit/2743f549a6fa4d0fc779c573bee0ef3529a4bae3)) (by [@luxass](https://github.com/luxass))
* add utility dependencies and improve error handling ([39eca3dc](https://github.com/ucdjs/ucd/commit/39eca3dcefd037aef240cf54ab48f4e2d054d057)) (by [@luxass](https://github.com/luxass))
* initialize fetch package with API client and documentation ([c4ec17fd](https://github.com/ucdjs/ucd/commit/c4ec17fd2fab890eb42c79a80bb5c5418c4fb19a)) (by [@luxass](https://github.com/luxass))
* add &#39;dev:api&#39; script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)) (by [@luxass](https://github.com/luxass))
* add constants for Unicode and UCDJS API URLs ([63b468f9](https://github.com/ucdjs/ucd/commit/63b468f95555ac8049c0c2f5f9b0476c7a5447a9)) (by [@luxass](https://github.com/luxass))
* enhance `PathFilterFn` to accept additional filters ([d9cf1fc6](https://github.com/ucdjs/ucd/commit/d9cf1fc67d5dd87793d6ffbc9de15dcc89996f14)) (by [@luxass](https://github.com/luxass))
* enhance path filter functionality ([b1929622](https://github.com/ucdjs/ucd/commit/b19296220de3ad86b80c8f209591751944594806)) (by [@luxass](https://github.com/luxass))
* update rm method to default to non-recursive and non-force ([6ad0a2c2](https://github.com/ucdjs/ucd/commit/6ad0a2c2e2e249bda32adafdaf395cd111d1679e)) (by [@luxass](https://github.com/luxass))
* add comprehensive tests for HTTPFileSystemBridge ([58d9abe8](https://github.com/ucdjs/ucd/commit/58d9abe835f6faa329c10c54c0ee7af3b01add9f)) (by [@luxass](https://github.com/luxass))
* enhance HTTPFileSystemBridge with new methods ([5ac936b2](https://github.com/ucdjs/ucd/commit/5ac936b28b62ccd9b579dfb492bb66683cde028a)) (by [@luxass](https://github.com/luxass))
* implement Node.js file system operations ([f9c79acf](https://github.com/ucdjs/ucd/commit/f9c79acff0421d045d3b0ab264c23149bf8614c5)) (by [@luxass](https://github.com/luxass))
* extend FileSystemBridge interface with new methods ([778da095](https://github.com/ucdjs/ucd/commit/778da0952a069895cca2093d8270034f05be5928)) (by [@luxass](https://github.com/luxass))
* add new fs impl ([8a09ff29](https://github.com/ucdjs/ucd/commit/8a09ff29cd76e6716951b4e37802605f3b886836)) (by [@luxass](https://github.com/luxass))
* add new vfs module ([3bf85d86](https://github.com/ucdjs/ucd/commit/3bf85d8635b539a613d7df79b7b27b1a6fb91b75)) (by [@luxass](https://github.com/luxass))
* add optional proxy URL to MirrorOptions and internal functions ([3292668c](https://github.com/ucdjs/ucd/commit/3292668cc95891c5fcbca98218f404bfd36ff551)) (by [@luxass](https://github.com/luxass))
* enhance validateUCDFiles to filter out directories and update test to reflect changes ([ef300d36](https://github.com/ucdjs/ucd/commit/ef300d362431912f2d5489736318e6f6adb6f0f8)) (by [@luxass](https://github.com/luxass))
* update readdir method to support recursive option and modify validateUCDFiles to handle directories ([30e5440e](https://github.com/ucdjs/ucd/commit/30e5440ecef3f45261f5dbdfa861590769d2a747)) (by [@luxass](https://github.com/luxass))
* update validateUCDFiles to return missing and not required files ([605ff972](https://github.com/ucdjs/ucd/commit/605ff9729d174766aedeaa0bf9535d220cfb8911)) (by [@luxass](https://github.com/luxass))
* add TODO to validateUCDFiles for returning extra files ([95d54a2c](https://github.com/ucdjs/ucd/commit/95d54a2c177320d1c03e52698f6d7907dbe4b965)) (by [@luxass](https://github.com/luxass))
* add validateUCDFiles function and update FSAdapter interface with exists and readdir methods ([470abb64](https://github.com/ucdjs/ucd/commit/470abb640a60801142e7e75f960d5783f0f767e0)) (by [@luxass](https://github.com/luxass))
* enhance mirrorUCDFiles to handle errors and return located files ([febe7ab6](https://github.com/ucdjs/ucd/commit/febe7ab67c2ba9853164182f1340cf964c8b8453)) (by [@luxass](https://github.com/luxass))
* enhance mirrorUCDFiles to handle errors and return located files ([b7e05f61](https://github.com/ucdjs/ucd/commit/b7e05f614b82929fce7b08eb586d0d379dcfdd4a)) (by [@luxass](https://github.com/luxass))
* enhance mirrorUCDFiles with pattern matching and error handling ([73c02513](https://github.com/ucdjs/ucd/commit/73c02513ba0fd8f6e62500bc954313e36cf37490)) (by [@luxass](https://github.com/luxass))
* add dependencies for unicode utilities and defu in package.json and pnpm-lock.yaml ([b7e31ff9](https://github.com/ucdjs/ucd/commit/b7e31ff9f734180bf439defbc6f942c124295f49)) (by [@luxass](https://github.com/luxass))
* implement mirrorUCDFiles ([119a25b9](https://github.com/ucdjs/ucd/commit/119a25b9210e68271a0565155a13335844a0ec5d)) (by [@luxass](https://github.com/luxass))
* add UCD file mirroring utilities and filesystem adapter ([e85bdbde](https://github.com/ucdjs/ucd/commit/e85bdbde6df5aaca29f214b943fbd85c53605ca3)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* ensure &#39;entries&#39; is an array before processing ([54af41b9](https://github.com/ucdjs/ucd/commit/54af41b92e2849e1b5eae3d39296ab733af21418)) (by [@luxass](https://github.com/luxass))
* set default baseUrl for HTTPFileSystemBridge ([0a699f21](https://github.com/ucdjs/ucd/commit/0a699f210b8eb60666773c8ec6d33db9cbc348cd)) (by [@luxass](https://github.com/luxass))
* ensure baseUrl is always defined ([0753a323](https://github.com/ucdjs/ucd/commit/0753a323055c91fc41f682b61a7ea0d98c6297da)) (by [@luxass](https://github.com/luxass))
* correct file path handling in flattenFilePaths function ([91aff454](https://github.com/ucdjs/ucd/commit/91aff45407699502d55c352a8dbe8b0d9a18eb6e)) (by [@luxass](https://github.com/luxass))
* update predefined filter patterns for exclusions ([c39fa797](https://github.com/ucdjs/ucd/commit/c39fa797388ee47812dffa05601a1b9666d1a388)) (by [@luxass](https://github.com/luxass))
* update listdir to return file names and enhance recursive listing ([f4f97aca](https://github.com/ucdjs/ucd/commit/f4f97acaba21c7dbb3958496ab4773cc98873491)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))
* update API URLs in mirror and validate test files to use UCDJS_API_BASE_URL ([8c7678e3](https://github.com/ucdjs/ucd/commit/8c7678e35659fcab55c2c6f5df05fa86aa2bac3c)) (by [@luxass](https://github.com/luxass))
* update API URLs in test files ([9dff312a](https://github.com/ucdjs/ucd/commit/9dff312a4ef4cdfeb26e6a263dc399eb07e1eb7f)) (by [@luxass](https://github.com/luxass))
* use UNICODE_PROXY_URL as default base URL ([a26f9757](https://github.com/ucdjs/ucd/commit/a26f975776218e6db3b64c3e5a3036fd05f75ebd)) (by [@luxass](https://github.com/luxass))
* update default Unicode API base URL ([2415c8e1](https://github.com/ucdjs/ucd/commit/2415c8e121fb7c1563371fac1a8e60f48be46362)) (by [@luxass](https://github.com/luxass))
* handle process.env safely in constants file ([1dca07f2](https://github.com/ucdjs/ucd/commit/1dca07f28c2bc5c95c5aa017562405a00b6a3c51)) (by [@luxass](https://github.com/luxass))
* correct mock reset method in validate test and add ucd-files to hidden logs ([6807b611](https://github.com/ucdjs/ucd/commit/6807b611919224970467a0c4c6e64a98c3a622c8)) (by [@luxass](https://github.com/luxass))

### 📚 Documentation
* enhance createPathFilter documentation with detailed examples ([f0308f87](https://github.com/ucdjs/ucd/commit/f0308f87cc02bd05533b59430a7892b8a40e0f22)) (by [@luxass](https://github.com/luxass))
* update README to enhance usage examples and clarify functionality ([82a55e1c](https://github.com/ucdjs/ucd/commit/82a55e1c4f87ced174802e0ac73ceb6364e48544)) (by [@luxass](https://github.com/luxass))


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
