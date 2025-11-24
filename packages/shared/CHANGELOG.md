# @ucdjs-internal/shared

## [0.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs-internal/shared@0.1.0...@ucdjs-internal/shared@0.1.0) (2025-11-24)


### Features
* add `isApiError` type guard and tests ([5b578e55](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d)) (by [@luxass](https://github.com/luxass))
* integrate MSW error handling in custom fetch ([46bfa215](https://github.com/ucdjs/ucd/commit/46bfa21518710a89ae42e0c8186d513bed2821f3)) (by [@luxass](https://github.com/luxass))
* add @luxass/msw-utils dependency ([38a33073](https://github.com/ucdjs/ucd/commit/38a3307370f38507dd75ecd3e70f15a3daf45f8f)) (by [@luxass](https://github.com/luxass))
* add getDefaultUCDEndpointConfig function ([f1877b20](https://github.com/ucdjs/ucd/commit/f1877b20b39fd5032a2a78ecacb81dee584df949)) (by [@luxass](https://github.com/luxass))
* export fetch types ([753cb566](https://github.com/ucdjs/ucd/commit/753cb566cb7b46ab19d25c43d7df2e5f3f426b71)) (by [@luxass](https://github.com/luxass))
* export custom fetch ([b1034af8](https://github.com/ucdjs/ucd/commit/b1034af8b2ee9316f26a70da89c2ed3feb0560f8)) (by [@luxass](https://github.com/luxass))
* add custom fetch ([d66c2282](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a)) (by [@luxass](https://github.com/luxass))
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* enhance directory pattern handling in filters ([616cf518](https://github.com/ucdjs/ucd/commit/616cf518bf7290342008eb04b854de5d402e1a6e)) (by [@luxass](https://github.com/luxass))
* enhance createPathFilter to use Set for unique include/exclude patterns ([09070da1](https://github.com/ucdjs/ucd/commit/09070da1fee2bfd32d7050839dce88c40a3b2741)) (by [@luxass](https://github.com/luxass))
* improve filter application in createPathFilter ([d3a11d5b](https://github.com/ucdjs/ucd/commit/d3a11d5b37ae13ad9c510f8b1ccf0fb6506a35ab)) (by [@luxass](https://github.com/luxass))
* enhance filtering options in getFileTree and getFilePaths ([c5335784](https://github.com/ucdjs/ucd/commit/c53357843da507204fd325f73af20a2df68780db)) (by [@luxass](https://github.com/luxass))
* update PathFilter API to use configuration object ([6c564aba](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532)) (by [@luxass](https://github.com/luxass))
* implement filterTreeStructure function for hierarchical filtering ([c7b7eb5b](https://github.com/ucdjs/ucd/commit/c7b7eb5bd0439a55389c3572b43bea323ad68e6e)) (by [@luxass](https://github.com/luxass))
* add concurrency limiter function ([b18de205](https://github.com/ucdjs/ucd/commit/b18de205b6f4b048f25d92587235c130da1e781e)) (by [@luxass](https://github.com/luxass))
* add `tryCatch` utility for error handling ([ca8e054d](https://github.com/ucdjs/ucd/commit/ca8e054d0692047affe2529d0dc0192867aafd17)) (by [@luxass](https://github.com/luxass))
* add shared package ([5e59cb10](https://github.com/ucdjs/ucd/commit/5e59cb10e82b5a2ba69dd3c4d9bd234030d52295)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b)) (by [@luxass](https://github.com/luxass))
* refactor UCD endpoint configuration handling ([f8174910](https://github.com/ucdjs/ucd/commit/f81749103cc764ff3c24fb20d32d004e53a1e5e9)) (by [@luxass](https://github.com/luxass))
* handle non-FetchError exceptions in customFetch ([845e51d4](https://github.com/ucdjs/ucd/commit/845e51d4e39f3d4c370a5f415ac16a064c62e9a7)) (by [@luxass](https://github.com/luxass))
* improve error handling for UCD endpoint config fetch ([5f4a4d54](https://github.com/ucdjs/ucd/commit/5f4a4d5467cb2830ab621d6efe2b6a9275cfbe3b)) (by [@luxass](https://github.com/luxass))
* ensure default include pattern is set correctly ([5b377716](https://github.com/ucdjs/ucd/commit/5b3777169ed3df4cfb439ee3907fdc968abb2f08)) (by [@luxass](https://github.com/luxass))
* update JSDoc for options parameter type ([720658a3](https://github.com/ucdjs/ucd/commit/720658a3dfcfadcd046c7a8bf9ebd337f6e4f7c4)) (by [@luxass](https://github.com/luxass))
* add support for disabling default exclusions in path filter ([cfd513ae](https://github.com/ucdjs/ucd/commit/cfd513aec6a5aa59e7342e424e2a5a182d2d84a5)) (by [@luxass](https://github.com/luxass))
* improve error handling for concurrency limit ([cd175fa3](https://github.com/ucdjs/ucd/commit/cd175fa3fee1e85b9221c827fed16a7e69a1b6ec)) (by [@luxass](https://github.com/luxass))

### Refactoring
* use native json parse ([PR #376](https://github.com/ucdjs/ucd/pull/376)) ([7cbf0e32](https://github.com/ucdjs/ucd/commit/7cbf0e3241aa6519848eefffec098f1c7e6ce17f)) (by [@luxass](https://github.com/luxass))
* enhance safeFetch response structure ([7a96c23d](https://github.com/ucdjs/ucd/commit/7a96c23dee833ce6098173fed4213c0f2552d218)) (by [@luxass](https://github.com/luxass))
* move ucd-config from client to shared ([d6094c9e](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c)) (by [@luxass](https://github.com/luxass))
* organise package structure ([80aaa22a](https://github.com/ucdjs/ucd/commit/80aaa22a655b778bf2ee3789fb8f4b3b37e87526)) (by [@luxass](https://github.com/luxass))
* update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)) (by [@luxass](https://github.com/luxass))
* update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)) (by [@luxass](https://github.com/luxass))
* enhance path filtering logic and update predefined filters ([cd5dd2aa](https://github.com/ucdjs/ucd/commit/cd5dd2aa0149386c50c7f460dcbeb99d98a22091)) (by [@luxass](https://github.com/luxass))
* extract concurrency validation to a separate function ([fdd57301](https://github.com/ucdjs/ucd/commit/fdd5730187e4eb4789521b3fa223d350442659dd)) (by [@luxass](https://github.com/luxass))
* migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa)) (by [@luxass](https://github.com/luxass))
* move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91)) (by [@luxass](https://github.com/luxass))