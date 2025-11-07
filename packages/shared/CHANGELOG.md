# @ucdjs-internal/shared

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
