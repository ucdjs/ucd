# @ucdjs-internal/shared

## [1.0.0](https://github.com/ucdjs/ucd/compare/@ucdjs-internal/shared@0.1.0...@ucdjs-internal/shared@1.0.0) (2025-11-16)

### refactor

* refactor(shared)!: use native json parse (#376) ([#376](https://github.com/ucdjs/ucd/issues/376)) ([7cbf0e32](https://github.com/ucdjs/ucd/commit/7cbf0e3241aa6519848eefffec098f1c7e6ce17f))
* refactor(shared): enhance safeFetch response structure ([7a96c23d](https://github.com/ucdjs/ucd/commit/7a96c23dee833ce6098173fed4213c0f2552d218))
* refactor(shared,client): move ucd-config from client to shared ([d6094c9e](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c))
* refactor(shared): organise package structure ([80aaa22a](https://github.com/ucdjs/ucd/commit/80aaa22a655b778bf2ee3789fb8f4b3b37e87526))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* refactor(shared): enhance path filtering logic and update predefined filters ([cd5dd2aa](https://github.com/ucdjs/ucd/commit/cd5dd2aa0149386c50c7f460dcbeb99d98a22091))
* refactor(shared): extract concurrency validation to a separate function ([fdd57301](https://github.com/ucdjs/ucd/commit/fdd5730187e4eb4789521b3fa223d350442659dd))
* refactor: migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa))
* refactor(shared, utils): move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91))

### Bug Fixes

* fix: update file paths to include 'extracted' prefix (#371) ([#371](https://github.com/ucdjs/ucd/issues/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243))
* fix: replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b))
* fix(shared): refactor UCD endpoint configuration handling ([f8174910](https://github.com/ucdjs/ucd/commit/f81749103cc764ff3c24fb20d32d004e53a1e5e9))
* fix(client): handle non-FetchError exceptions in customFetch ([845e51d4](https://github.com/ucdjs/ucd/commit/845e51d4e39f3d4c370a5f415ac16a064c62e9a7))
* fix(shared): improve error handling for UCD endpoint config fetch ([5f4a4d54](https://github.com/ucdjs/ucd/commit/5f4a4d5467cb2830ab621d6efe2b6a9275cfbe3b))
* fix(shared): ensure default include pattern is set correctly ([5b377716](https://github.com/ucdjs/ucd/commit/5b3777169ed3df4cfb439ee3907fdc968abb2f08))
* fix(shared): update JSDoc for options parameter type ([720658a3](https://github.com/ucdjs/ucd/commit/720658a3dfcfadcd046c7a8bf9ebd337f6e4f7c4))
* fix(shared): add support for disabling default exclusions in path filter ([cfd513ae](https://github.com/ucdjs/ucd/commit/cfd513aec6a5aa59e7342e424e2a5a182d2d84a5))
* fix: improve error handling for concurrency limit ([cd175fa3](https://github.com/ucdjs/ucd/commit/cd175fa3fee1e85b9221c827fed16a7e69a1b6ec))

### Features

* feat(shared): add `isApiError` type guard and tests ([5b578e55](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d))
* feat(shared): integrate MSW error handling in custom fetch ([46bfa215](https://github.com/ucdjs/ucd/commit/46bfa21518710a89ae42e0c8186d513bed2821f3))
* feat(shared): add @luxass/msw-utils dependency ([38a33073](https://github.com/ucdjs/ucd/commit/38a3307370f38507dd75ecd3e70f15a3daf45f8f))
* feat(shared): add getDefaultUCDEndpointConfig function ([f1877b20](https://github.com/ucdjs/ucd/commit/f1877b20b39fd5032a2a78ecacb81dee584df949))
* feat(shared): export fetch types ([753cb566](https://github.com/ucdjs/ucd/commit/753cb566cb7b46ab19d25c43d7df2e5f3f426b71))
* feat(shared): export custom fetch ([b1034af8](https://github.com/ucdjs/ucd/commit/b1034af8b2ee9316f26a70da89c2ed3feb0560f8))
* feat(shared): add custom fetch ([d66c2282](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a))
* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(filter): enhance directory pattern handling in filters ([616cf518](https://github.com/ucdjs/ucd/commit/616cf518bf7290342008eb04b854de5d402e1a6e))
* feat(shared): enhance createPathFilter to use Set for unique include/exclude patterns ([09070da1](https://github.com/ucdjs/ucd/commit/09070da1fee2bfd32d7050839dce88c40a3b2741))
* feat(ucd-store): improve filter application in createPathFilter ([d3a11d5b](https://github.com/ucdjs/ucd/commit/d3a11d5b37ae13ad9c510f8b1ccf0fb6506a35ab))
* feat(ucd-store): enhance filtering options in getFileTree and getFilePaths ([c5335784](https://github.com/ucdjs/ucd/commit/c53357843da507204fd325f73af20a2df68780db))
* feat(shared): update PathFilter API to use configuration object ([6c564aba](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532))
* feat(shared): implement filterTreeStructure function for hierarchical filtering ([c7b7eb5b](https://github.com/ucdjs/ucd/commit/c7b7eb5bd0439a55389c3572b43bea323ad68e6e))
* feat(shared): add concurrency limiter function ([b18de205](https://github.com/ucdjs/ucd/commit/b18de205b6f4b048f25d92587235c130da1e781e))
* feat(shared): add `tryCatch` utility for error handling ([ca8e054d](https://github.com/ucdjs/ucd/commit/ca8e054d0692047affe2529d0dc0192867aafd17))
* feat: add shared package ([5e59cb10](https://github.com/ucdjs/ucd/commit/5e59cb10e82b5a2ba69dd3c4d9bd234030d52295))

### Miscellaneous

* fix ([be784d36](https://github.com/ucdjs/ucd/commit/be784d364d17c12c0592cd4aa721afe4a4192091))
* Merge remote-tracking branch 'origin/main' into gitignore-style ([31c34461](https://github.com/ucdjs/ucd/commit/31c3446140303ed930f736ac251da74589601052))
