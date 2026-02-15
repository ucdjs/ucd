# @ucdjs-internal/shared

## [0.1.1](https://github.com/ucdjs/ucd/compare/@ucdjs-internal/shared@0.1.0...@ucdjs-internal/shared@0.1.1) (2026-02-15)


### 🚀 Features
* add path normalization functions for filtering ([10028cec](https://github.com/ucdjs/ucd/commit/10028cec87f3b66eef5cb1c49133b66e47e55b44)) (by [@luxass](https://github.com/luxass))
* enhance path normalization in createPathFilter ([35499147](https://github.com/ucdjs/ucd/commit/3549914765e86a22ce0901583c40fa07dd09a78f)) (by [@luxass](https://github.com/luxass))
* enhance path normalization for API file-tree ([1dde1e18](https://github.com/ucdjs/ucd/commit/1dde1e18adca10a5a0513d11bc5ea4bacbc21adf)) (by [@luxass](https://github.com/luxass))
* add file search and flattening functions ([9598878d](https://github.com/ucdjs/ucd/commit/9598878d7fadbbb541c7ec90fce3bd320702b327)) (by [@luxass](https://github.com/luxass))
* enhance schema validation error handling ([c1445b7f](https://github.com/ucdjs/ucd/commit/c1445b7f67be04628fa98e387d93348ca68cc2c5)) (by [@luxass](https://github.com/luxass))
* add custom error handling for schema validation ([565c5bda](https://github.com/ucdjs/ucd/commit/565c5bdaaebac7d94b49249cb06d4fd55be3dbac)) (by [@luxass](https://github.com/luxass))
* add file extension exclusion logic for manifest generation ([2810bfcb](https://github.com/ucdjs/ucd/commit/2810bfcb2eeb0ee1bce30303265e7c6ccf550674)) (by [@luxass](https://github.com/luxass))
* add more debug to try catch helpers ([320d297f](https://github.com/ucdjs/ucd/commit/320d297f0673ed07e8fcb789b7a1248181296ff6)) (by [@luxass](https://github.com/luxass))
* add support for zod schemas in custom fetch ([75141595](https://github.com/ucdjs/ucd/commit/75141595f5c02147cd8fefb5883bbc5f09c68216)) (by [@luxass](https://github.com/luxass))
* add per-version UCD store manifest endpoint and enhance config response ([ee76728d](https://github.com/ucdjs/ucd/commit/ee76728df3bb03191b1d099ff316f7ad7e8cd111)) (by [@luxass](https://github.com/luxass))
* enhance brace expansion validation in glob patterns ([73dfd94b](https://github.com/ucdjs/ucd/commit/73dfd94b9aa1ad4a559d4af574a7151b467b5c72)) (by [@luxass](https://github.com/luxass))
* enhance glob pattern validation limits and structure ([82a1c1c2](https://github.com/ucdjs/ucd/commit/82a1c1c2ef8806ff4a9043764d9ced2f38a1ce4b)) (by [@luxass](https://github.com/luxass))
* enhance glob pattern validation for nesting and brackets ([72652993](https://github.com/ucdjs/ucd/commit/72652993647c41a832937da0a82485910f2f7440)) (by [@luxass](https://github.com/luxass))
* enhance glob pattern validation for braces ([0204ab20](https://github.com/ucdjs/ucd/commit/0204ab20d47438346f8f4f06bd4e1cc109829ee4)) (by [@luxass](https://github.com/luxass))
* add glob pattern validation and logging for search ([a2661d02](https://github.com/ucdjs/ucd/commit/a2661d02d0d9be874d884509d9d0e9d46135183d)) (by [@luxass](https://github.com/luxass))
* add search endpoint with glob pattern support ([901316dd](https://github.com/ucdjs/ucd/commit/901316dd0971d406b4fbd101763f4407a349af4b)) (by [@luxass](https://github.com/luxass))
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

### 🐞 Bug Fixes
* correct extglob depth validation logic ([02fdb340](https://github.com/ucdjs/ucd/commit/02fdb34035a614d1859cae7131ba298e159f7878)) (by [@luxass](https://github.com/luxass))
* improve glob pattern validation for commas ([cf001582](https://github.com/ucdjs/ucd/commit/cf001582e7eae3061c2adbda01fc50e955ea08b2)) (by [@luxass](https://github.com/luxass))
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b)) (by [@luxass](https://github.com/luxass))
* refactor UCD endpoint configuration handling ([f8174910](https://github.com/ucdjs/ucd/commit/f81749103cc764ff3c24fb20d32d004e53a1e5e9)) (by [@luxass](https://github.com/luxass))
* handle non-FetchError exceptions in customFetch ([845e51d4](https://github.com/ucdjs/ucd/commit/845e51d4e39f3d4c370a5f415ac16a064c62e9a7)) (by [@luxass](https://github.com/luxass))
* improve error handling for UCD endpoint config fetch ([5f4a4d54](https://github.com/ucdjs/ucd/commit/5f4a4d5467cb2830ab621d6efe2b6a9275cfbe3b)) (by [@luxass](https://github.com/luxass))
* ensure default include pattern is set correctly ([5b377716](https://github.com/ucdjs/ucd/commit/5b3777169ed3df4cfb439ee3907fdc968abb2f08)) (by [@luxass](https://github.com/luxass))
* update JSDoc for options parameter type ([720658a3](https://github.com/ucdjs/ucd/commit/720658a3dfcfadcd046c7a8bf9ebd337f6e4f7c4)) (by [@luxass](https://github.com/luxass))
* add support for disabling default exclusions in path filter ([cfd513ae](https://github.com/ucdjs/ucd/commit/cfd513aec6a5aa59e7342e424e2a5a182d2d84a5)) (by [@luxass](https://github.com/luxass))
* improve error handling for concurrency limit ([cd175fa3](https://github.com/ucdjs/ucd/commit/cd175fa3fee1e85b9221c827fed16a7e69a1b6ec)) (by [@luxass](https://github.com/luxass))


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
