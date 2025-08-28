# @ucdjs/shared

## 0.1.0

### Minor Changes

- [#214](https://github.com/ucdjs/ucd/pull/214) [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5) Thanks [@luxass](https://github.com/luxass)! - feat: add tryCatch utility function

  Added a new `tryCatch` function to the shared utilities for safe error handling and consistent error patterns across the monorepo.

- [#212](https://github.com/ucdjs/ucd/pull/212) [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459) Thanks [@luxass](https://github.com/luxass)! - feat: add new @ucdjs/shared package for internal utilities

  This new package contains internal utilities and patterns used across the UCD monorepo, including:

  - `safeJsonParse` utility for safe JSON parsing
  - Foundation for shared Result types and async utilities

  This package is internal and may change without semver constraints. External users should use `@ucdjs/utils` for stable utilities.

### Patch Changes

- [#216](https://github.com/ucdjs/ucd/pull/216) [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743) Thanks [@luxass](https://github.com/luxass)! - feat: introduce own implementation of `p-limit`

- Updated dependencies [[`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77)]:
  - @ucdjs/fetch@0.1.0
  - @ucdjs/env@0.1.0
