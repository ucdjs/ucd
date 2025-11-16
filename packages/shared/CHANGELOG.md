# @ucdjs-internal/shared

## [1.0.0](https://github.com/ucdjs/ucd/compare/@ucdjs-internal/shared@0.1.0...@ucdjs-internal/shared@1.0.0) (2025-11-16)

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

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* refactor(shared)!: use native json parse (#376) ([#376](https://github.com/ucdjs/ucd/issues/376)) ([7cbf0e32](https://github.com/ucdjs/ucd/commit/7cbf0e3241aa6519848eefffec098f1c7e6ce17f))
* chore: switch to @unicode-utils/* (#374) ([#374](https://github.com/ucdjs/ucd/issues/374)) ([735ae595](https://github.com/ucdjs/ucd/commit/735ae595c099d97724007583a4a8a66cd9d5a4f9))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: lint ([be350048](https://github.com/ucdjs/ucd/commit/be350048f98d0e5459cf1fa3334daed6abfb5216))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* chore(shared): update @luxass/msw-utils to version 0.4.0 ([0f120101](https://github.com/ucdjs/ucd/commit/0f120101aacf1244fcef52898725aff8de6883f0))
* chore: fix comment ([c4681969](https://github.com/ucdjs/ucd/commit/c46819694529f9318764f75423bca58156c5f3e4))
* chore: add rolldown to devDependencies in package.json and pnpm-lock.yaml ([3668e694](https://github.com/ucdjs/ucd/commit/3668e6947fc9d366cd5f0db28d8538bc21e9e605))
* fix ([be784d36](https://github.com/ucdjs/ucd/commit/be784d364d17c12c0592cd4aa721afe4a4192091))
* test(client): update file and version resource tests to use destructured response ([30d6cba9](https://github.com/ucdjs/ucd/commit/30d6cba975707a9c1c1545d000eabff3c86807c5))
* refactor(shared): enhance safeFetch response structure ([7a96c23d](https://github.com/ucdjs/ucd/commit/7a96c23dee833ce6098173fed4213c0f2552d218))
* chore: remove leftover debug ([1c369074](https://github.com/ucdjs/ucd/commit/1c3690748c18da2a49f1aea333b034104e05f37f))
* chore(shared): add @ucdjs/schemas dependency ([81a51811](https://github.com/ucdjs/ucd/commit/81a518116af91191fc7509d138d970638a0898d8))
* refactor(shared,client): move ucd-config from client to shared ([d6094c9e](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c))
* test(shared): use real timers after each (resolves #317) ([#317](https://github.com/ucdjs/ucd/issues/317)) ([c1be803c](https://github.com/ucdjs/ucd/commit/c1be803c5f4191a803f44c693314201e8382e2b7))
* chore: apply coderabbit suggestion ([f00ba266](https://github.com/ucdjs/ucd/commit/f00ba266da39a16dbeaa4753337402aea6b15da9))
* chore: fix typo ([434b2dd9](https://github.com/ucdjs/ucd/commit/434b2dd937e25f340e8fb2f85776523ba85e1d93))
* chore: lint ([4ff4285b](https://github.com/ucdjs/ucd/commit/4ff4285b17afd79b02c9cd372701aa124a1d2039))
* test(shared): move files around ([6790deba](https://github.com/ucdjs/ucd/commit/6790deba3564266a935fcdb21e0f9ca9df767653))
* refactor(shared): organise package structure ([80aaa22a](https://github.com/ucdjs/ucd/commit/80aaa22a655b778bf2ee3789fb8f4b3b37e87526))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update devDependencies to use 'catalog:types' ([04277f87](https://github.com/ucdjs/ucd/commit/04277f879f4193da7f9d99711d8339ed9faae47f))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* chore: fix coderabbit suggestion ([1dd625d9](https://github.com/ucdjs/ucd/commit/1dd625d9367db2653a4e208e3b5344583056c1c1))
* chore: fix invalid reference ([aa7d4403](https://github.com/ucdjs/ucd/commit/aa7d4403647966b7522d74fafc2bf32ec8c416ac))
* chore: fix picomatch import ([96657bd8](https://github.com/ucdjs/ucd/commit/96657bd8e18eb771394130e879ace1b9088d6cf7))
* Merge remote-tracking branch 'origin/main' into gitignore-style ([31c34461](https://github.com/ucdjs/ucd/commit/31c3446140303ed930f736ac251da74589601052))
* chore: format ([76f12e9c](https://github.com/ucdjs/ucd/commit/76f12e9c16f669bb09e925dce62b400ccb76c6ea))
* chore(shared): add '@ucdjs/shared' as a workspace dependency ([791ff5ef](https://github.com/ucdjs/ucd/commit/791ff5ef78a839b468f31151631c490c50c14ac8))
* chore(shared): replace console.error with debug logging in safeJsonParse ([97ba659f](https://github.com/ucdjs/ucd/commit/97ba659f099823e036453e10167cc21f071abc50))
* chore: add debug package and types ([eeab29bc](https://github.com/ucdjs/ucd/commit/eeab29bce154212dc90f332da2a4e123ea053dab))
* test(shared): enhance tests for createPathFilter functionality ([c9ccd8f9](https://github.com/ucdjs/ucd/commit/c9ccd8f9bb4ee31605813f5d365062cc66a3f222))
* chore: lint ([d7c60e1a](https://github.com/ucdjs/ucd/commit/d7c60e1ab3a7900dcd0c15956451a1030e3898e8))
* test(shared): make filter tests work with new filter ([f0dfb1ff](https://github.com/ucdjs/ucd/commit/f0dfb1ff95ccebc4eea5e2856152b4aaa41eafbe))
* refactor(shared): enhance path filtering logic and update predefined filters ([cd5dd2aa](https://github.com/ucdjs/ucd/commit/cd5dd2aa0149386c50c7f460dcbeb99d98a22091))
* refactor(shared): extract concurrency validation to a separate function ([fdd57301](https://github.com/ucdjs/ucd/commit/fdd5730187e4eb4789521b3fa223d350442659dd))
* test: add FIFO task processing test for createConcurrencyLimiter ([96166fe2](https://github.com/ucdjs/ucd/commit/96166fe2e15feef81f42bef89e43029f4f2b84b1))
* test: add test for handling positive infinity in createConcurrencyLimiter ([1bbc1499](https://github.com/ucdjs/ucd/commit/1bbc149929d147a17550327533fc2a2b68af85bd))
* chore: fix typo ([3b8204d1](https://github.com/ucdjs/ucd/commit/3b8204d1f45036afd1562cdff009459f6db6ef18))
* chore: export promise concurrency type ([74f50fa0](https://github.com/ucdjs/ucd/commit/74f50fa0901bd70a268eeb32422a8cda3e0590a0))
* test(shared): add comprehensive tests for createConcurrencyLimiter ([46ff45ae](https://github.com/ucdjs/ucd/commit/46ff45aeb67f0d34e1d48b821eebe24e9ab2467c))
* chore: remove `p-limit` dependency across multiple packages ([a73147af](https://github.com/ucdjs/ucd/commit/a73147af43a01492e36e97b2403f565b5835dcd3))
* test: add tests for try-catch ([12cb8bc0](https://github.com/ucdjs/ucd/commit/12cb8bc0e80f2e1e5afe27cf278049f21ac50f10))
* refactor: migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa))
* refactor(shared, utils): move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91))


## 0.1.0

### Minor Changes

- [#223](https://github.com/ucdjs/ucd/pull/223) [`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59) Thanks [@luxass](https://github.com/luxass)! - ## New filterTreeStructure Function

  Added a new utility function for filtering tree structures using PathFilter:

  ```ts
  export function filterTreeStructure(
    pathFilter: PathFilter,
    entries: TreeEntry[],
    extraOptions?: Pick<PathFilterOptions, "include" | "exclude">
  ): TreeEntry[];
  ```

  ### Features

  - **Recursive filtering**: Processes nested directory structures
  - **Path construction**: Builds full paths from relative entry paths
  - **Smart directory inclusion**: Includes directories if they contain matching files, even if the directory itself doesn't match
  - **Structure preservation**: Maintains tree hierarchy while filtering contents

  ### TreeEntry Type

  ```ts
  type TreeEntry =
    | {
        type: "file";
        name: string;
        path: string;
      }
    | {
        type: "directory";
        name: string;
        path: string;
        children: TreeEntry[];
      };
  ```

  ### Example Usage

  ```ts
  const filter = createPathFilter({
    include: ["**/*.ts"],
    exclude: ["**/*.test.ts"],
  });

  const tree = [
    {
      type: "directory",
      name: "src",
      path: "src",
      children: [
        { type: "file", name: "index.ts", path: "index.ts" },
        { type: "file", name: "index.test.ts", path: "index.test.ts" },
      ],
    },
  ];

  const filtered = filterTreeStructure(filter, tree);
  // Result: src directory with only index.ts (test file excluded)
  ```

- [#316](https://github.com/ucdjs/ucd/pull/316) [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce) Thanks [@luxass](https://github.com/luxass)! - add new customFetch function

- [#173](https://github.com/ucdjs/ucd/pull/173) [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813) Thanks [@luxass](https://github.com/luxass)! - feat: introduce a new `isApiError` type guard

- [#214](https://github.com/ucdjs/ucd/pull/214) [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5) Thanks [@luxass](https://github.com/luxass)! - feat: add tryCatch utility function

  Added a new `tryCatch` function to the shared utilities for safe error handling and consistent error patterns across the monorepo.

- [#223](https://github.com/ucdjs/ucd/pull/223) [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532) Thanks [@luxass](https://github.com/luxass)! - ## PathFilter API Changes

  Updated the PathFilter API to use a configuration object with separate `include` and `exclude` arrays instead of mixing patterns with `!` prefixes.

  **Before:**

  ```ts
  const filter = createPathFilter([
    "*.js",
    "!*.test.js",
    "!**/node_modules/**",
  ]);
  ```

  **After:**

  ```ts
  const filter = createPathFilter({
    include: ["*.js"],
    exclude: ["*.test.js", "**/node_modules/**"],
  });
  ```

  ### API Changes

  - `createPathFilter(patterns: string[])` → `createPathFilter(config: PathFilterOptions)`
  - `filter.extend(patterns: string[])` → `filter.extend(config: Pick<PathFilterOptions, 'include' | 'exclude'>)`
  - `filter.patterns(): string[]` → `filter.patterns(): PathFilterOptions`
  - `filter(path, extraPatterns: string[])` → `filter(path, extraConfig: Pick<PathFilterOptions, 'include' | 'exclude'>)`

  ### Default Behavior

  - If `include` is empty or not provided, includes everything using `**` pattern
  - `exclude` patterns always override `include` patterns
  - Default exclusions for `.zip` and `.pdf` files (can be disabled with `disableDefaultExclusions: true`)

  ### Updated PRECONFIGURED_FILTERS

  Preconfigured filter constants now return arrays:

  **Before:**

  ```ts
  PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES; // "!**/*Test*"
  ```

  **After:**

  ```ts
  PRECONFIGURED_FILTERS.TEST_FILES; // ["**/*Test*"]
  ```

  Available filters:

  - `TEST_FILES`: `["**/*Test*"]`
  - `README_FILES`: `["**/ReadMe.txt"]`
  - `HTML_FILES`: `["**/*.html"]`
  - `TEST_RELATED`: `["**/*.test.*", "**/*.spec.*", "**/__tests__/**"]`

- [#325](https://github.com/ucdjs/ucd/pull/325) [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868) Thanks [@luxass](https://github.com/luxass)! - Move `discoverEndpointsFromConfig` from `@ucdjs/client` to `@ucdjs-internal/shared`.

- [#212](https://github.com/ucdjs/ucd/pull/212) [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459) Thanks [@luxass](https://github.com/luxass)! - feat: add new @ucdjs-internal/shared package for internal utilities

  This new package contains internal utilities and patterns used across the UCD monorepo, including:

  - `safeJsonParse` utility for safe JSON parsing
  - Foundation for shared Result types and async utilities

  This package is internal and may change without semver constraints. External users should use `@ucdjs/utils` for stable utilities.

- [#326](https://github.com/ucdjs/ucd/pull/326) [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640) Thanks [@luxass](https://github.com/luxass)! - Introduce a `getDefaultUCDEndpointConfig` which uses a build time define, to inject the currently running endpoint config into the build.

### Patch Changes

- [#216](https://github.com/ucdjs/ucd/pull/216) [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743) Thanks [@luxass](https://github.com/luxass)! - feat: introduce own implementation of `p-limit`

- [#319](https://github.com/ucdjs/ucd/pull/319) [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0) Thanks [@luxass](https://github.com/luxass)! - Expose fetch types

- Updated dependencies [[`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8)]:
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0
