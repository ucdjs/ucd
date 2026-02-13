# @ucdjs-internal/shared

## 1.0.0




### &nbsp;&nbsp;&nbsp;💥 Breaking Changes


- **shared**:
      - use native json parse &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(7cbf0e32)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/7cbf0e3241aa6519848eefffec098f1c7e6ce17f)  
### &nbsp;&nbsp;&nbsp;🚀 Features

- add file extension exclusion logic for manifest generation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(2810bfcb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2810bfcb2eeb0ee1bce30303265e7c6ccf550674)- add shared package &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5e59cb10)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5e59cb10e82b5a2ba69dd3c4d9bd234030d52295)
- **shared**:
      - add path normalization functions for filtering &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(10028cec)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/10028cec87f3b66eef5cb1c49133b66e47e55b44)    - enhance path normalization in createPathFilter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(35499147)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/3549914765e86a22ce0901583c40fa07dd09a78f)    - enhance path normalization for API file-tree &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1dde1e18)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1dde1e18adca10a5a0513d11bc5ea4bacbc21adf)    - add file search and flattening functions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9598878d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9598878d7fadbbb541c7ec90fce3bd320702b327)    - enhance schema validation error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c1445b7f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c1445b7f67be04628fa98e387d93348ca68cc2c5)    - add custom error handling for schema validation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(565c5bda)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/565c5bdaaebac7d94b49249cb06d4fd55be3dbac)    - add more debug to try catch helpers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(320d297f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/320d297f0673ed07e8fcb789b7a1248181296ff6)    - add support for zod schemas in custom fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(75141595)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/75141595f5c02147cd8fefb5883bbc5f09c68216)    - enhance brace expansion validation in glob patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(73dfd94b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/73dfd94b9aa1ad4a559d4af574a7151b467b5c72)    - enhance glob pattern validation limits and structure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(82a1c1c2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/82a1c1c2ef8806ff4a9043764d9ced2f38a1ce4b)    - enhance glob pattern validation for nesting and brackets &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(72652993)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/72652993647c41a832937da0a82485910f2f7440)    - enhance glob pattern validation for braces &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0204ab20)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0204ab20d47438346f8f4f06bd4e1cc109829ee4)    - add `isApiError` type guard and tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5b578e55)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d)    - integrate MSW error handling in custom fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(46bfa215)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/46bfa21518710a89ae42e0c8186d513bed2821f3)    - add @luxass/msw-utils dependency &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(38a33073)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/38a3307370f38507dd75ecd3e70f15a3daf45f8f)    - add getDefaultUCDEndpointConfig function &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f1877b20)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f1877b20b39fd5032a2a78ecacb81dee584df949)    - export fetch types &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(753cb566)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/753cb566cb7b46ab19d25c43d7df2e5f3f426b71)    - export custom fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b1034af8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b1034af8b2ee9316f26a70da89c2ed3feb0560f8)    - add custom fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d66c2282)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a)    - migrate utilities to @ucdjs-internal/shared &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4d7588fd)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)    - enhance createPathFilter to use Set for unique include/exclude patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(09070da1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/09070da1fee2bfd32d7050839dce88c40a3b2741)    - update PathFilter API to use configuration object &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6c564aba)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532)    - implement filterTreeStructure function for hierarchical filtering &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c7b7eb5b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c7b7eb5bd0439a55389c3572b43bea323ad68e6e)    - add concurrency limiter function &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b18de205)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b18de205b6f4b048f25d92587235c130da1e781e)    - add `tryCatch` utility for error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ca8e054d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ca8e054d0692047affe2529d0dc0192867aafd17)  - **api**:
      - add per-version UCD store manifest endpoint and enhance config response &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ee76728d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ee76728df3bb03191b1d099ff316f7ad7e8cd111)    - add glob pattern validation and logging for search &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a2661d02)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a2661d02d0d9be874d884509d9d0e9d46135183d)    - add search endpoint with glob pattern support &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(901316dd)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/901316dd0971d406b4fbd101763f4407a349af4b)  - **filter**:
      - enhance directory pattern handling in filters &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(616cf518)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/616cf518bf7290342008eb04b854de5d402e1a6e)  - **ucd-store**:
      - improve filter application in createPathFilter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d3a11d5b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d3a11d5b37ae13ad9c510f8b1ccf0fb6506a35ab)    - enhance filtering options in getFileTree and getFilePaths &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c5335784)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c53357843da507204fd325f73af20a2df68780db)  
### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- update file paths to include &#39;extracted&#39; prefix &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(2f455a5f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)- replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(301056ad)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b)- improve error handling for concurrency limit &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(cd175fa3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/cd175fa3fee1e85b9221c827fed16a7e69a1b6ec)
- **shared**:
      - correct extglob depth validation logic &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(02fdb340)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/02fdb34035a614d1859cae7131ba298e159f7878)    - improve glob pattern validation for commas &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(cf001582)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/cf001582e7eae3061c2adbda01fc50e955ea08b2)    - refactor UCD endpoint configuration handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f8174910)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f81749103cc764ff3c24fb20d32d004e53a1e5e9)    - improve error handling for UCD endpoint config fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5f4a4d54)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5f4a4d5467cb2830ab621d6efe2b6a9275cfbe3b)    - ensure default include pattern is set correctly &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5b377716)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5b3777169ed3df4cfb439ee3907fdc968abb2f08)    - update JSDoc for options parameter type &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(720658a3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/720658a3dfcfadcd046c7a8bf9ebd337f6e4f7c4)    - add support for disabling default exclusions in path filter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(cfd513ae)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/cfd513aec6a5aa59e7342e424e2a5a182d2d84a5)  - **client**:
      - handle non-FetchError exceptions in customFetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(845e51d4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/845e51d4e39f3d4c370a5f415ac16a064c62e9a7)  
### &nbsp;&nbsp;&nbsp;Refactoring

- reorganize pnpm catalogs for better scoping &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ba721776)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ba721776cf6fad9cdae2ba9617e52fca7dff1499)- remove deprecated ucd-store.json endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9d94bacf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9d94bacfde07fe1997a2db36de08eac5380b8183)- rename tryCatch to wrapTry &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c71e6b11)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c71e6b11a5ee0e21747f887a5e5b9546993417e2)- rename tryCatch to wrapTry and introduce tryOr for enhanced error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(13646b95)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/13646b95334fe5591dc63a0a83fc0ba1eedace99)- update tsconfig references to use @ucdjs-tooling/tsconfig &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e5c39ac8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)- migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(49318725)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa)
- **path-utils, shared-ui, shared, utils**:
      - update exports to use explicit file paths &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c2a39fbf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c2a39fbf6da9fea22b15794d382b513d48e7670e)  - **shared-ui**:
      - reorganize component imports to ui directory &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c64c288f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c64c288fba929ff4f9f32c008adb0c836c814177)  - **shared**:
      - enhance file exports in index.ts &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d2cc2d2d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d2cc2d2db6f101dd9cc569e2c495f7f072398937)    - improve type handling in filter functions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(188d0996)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/188d0996928af82f99cfde195eeba1eeed537498)    - remove extglob depth validation and improve whitespace handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(04b78b2c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/04b78b2cfb03c7d247be38227a87badfd087efa8)    - streamline glob pattern validation logic &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(35f93d30)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/35f93d30d380759126d6093e386e8ece91ba5c8d)    - enhance safeFetch response structure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(7a96c23d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/7a96c23dee833ce6098173fed4213c0f2552d218)    - organise package structure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(80aaa22a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/80aaa22a655b778bf2ee3789fb8f4b3b37e87526)    - enhance path filtering logic and update predefined filters &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(cd5dd2aa)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/cd5dd2aa0149386c50c7f460dcbeb99d98a22091)    - extract concurrency validation to a separate function &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(fdd57301)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/fdd5730187e4eb4789521b3fa223d350442659dd)  - **utils**:
      - remove unused type `TreeEntry` from exports &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f1e82e6c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f1e82e6cbe71932122a8dfe705d52e360cac4b7d)  - **api**:
      - remove deprecated well-known routes and update manifest endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1fe0d558)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1fe0d558fa35373f7794ab549c8d0b774b1107d4)  - **shared,client**:
      - move ucd-config from client to shared &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d6094c9e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c)  - **tsdown-config**:
      - update package references to @ucdjs-tooling/tsdown-config &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ccc002da)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)  - **shared, utils**:
      - move `safeJsonParse` function to shared package &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ee893aa4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91)  
### &nbsp;&nbsp;&nbsp;Tests

- add FIFO task processing test for createConcurrencyLimiter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(96166fe2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/96166fe2e15feef81f42bef89e43029f4f2b84b1)- add test for handling positive infinity in createConcurrencyLimiter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1bbc1499)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1bbc149929d147a17550327533fc2a2b68af85bd)- add tests for try-catch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(12cb8bc0)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/12cb8bc0e80f2e1e5afe27cf278049f21ac50f10)
- **shared**:
      - update error emission for schema validation failure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(2ac5d5d9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2ac5d5d962cdf8c39d892faa1dfb30495987ff66)    - fix failing test &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b8c75752)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b8c75752704827b00946ae989b57385432b547d3)    - add glob matching tests for various patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4a1bd2c1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4a1bd2c1145b2bd4ea8aa09027fe6ae56ef8e099)    - use real timers after each &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c1be803c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c1be803c5f4191a803f44c693314201e8382e2b7)    - move files around &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6790deba)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6790deba3564266a935fcdb21e0f9ca9df767653)    - enhance tests for createPathFilter functionality &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c9ccd8f9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c9ccd8f9bb4ee31605813f5d365062cc66a3f222)    - make filter tests work with new filter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f0dfb1ff)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f0dfb1ff95ccebc4eea5e2856152b4aaa41eafbe)    - add comprehensive tests for createConcurrencyLimiter &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(46ff45ae)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/46ff45aeb67f0d34e1d48b821eebe24e9ab2467c)  - **client**:
      - update file and version resource tests to use destructured response &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(30d6cba9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/30d6cba975707a9c1c1545d000eabff3c86807c5)  


##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/v0.1.0...v1.0.0)

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
