# @ucdjs/cli

## [99.99.0](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.0...@ucdjs/cli@99.99.0) (2025-11-16)

### Features

* feat(shared): update CLIStoreCmdSharedFlags to use include/exclude patterns ([3a90b66d](https://github.com/ucdjs/ucd/commit/3a90b66dd211f4c4a2608837a4d550ace7a10f73))
* feat(ucd-store): add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37))
* feat(cli): enhance store initialization with dry-run mode and add tests ([4aee44b0](https://github.com/ucdjs/ucd/commit/4aee44b0cd9449df80e50bdd930ef50c64c8ebe7))
* feat(cli): add analyze command for UCD store ([b22886ad](https://github.com/ucdjs/ucd/commit/b22886ade9f28bc6f0a8e54f29328376a0a53eec))
* feat(cli): enhance CLI store command with version selection ([9caa6a34](https://github.com/ucdjs/ucd/commit/9caa6a347138f2f3ec5ec20324c4bca82685ad68))
* feat(cli): enhance CLI store command with version selection ([27db542d](https://github.com/ucdjs/ucd/commit/27db542d96bd9b9f4f64dcecdf0bad52ff864bf1))
* feat(cli): add 'dev:api' script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154))
* feat: implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303))
* feat: add store commands for clean, repair, status, and validate ([ed47d40a](https://github.com/ucdjs/ucd/commit/ed47d40a7e3b7dd4413c068469abc2cc1aec6474))
* feat: add store command ([0ba52fac](https://github.com/ucdjs/ucd/commit/0ba52fac19f587fc8428c07580424d7861fdc298))
* feat: add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058))
* feat: add HTML and README file exclusion options to download command ([36d1bc0e](https://github.com/ucdjs/ucd/commit/36d1bc0ee832e67f211613b0d962dc86a2b0fb3f))
* feat: enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588))
* feat: enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a))

### Bug Fixes

* fix(cli): update dependency from `@luxass/unicode-utils-old` to `@luxass/unicode-utils` ([b5d2405b](https://github.com/ucdjs/ucd/commit/b5d2405b9993896b207275e4b95b15f75dc872f3))
* fix(cli, schema-gen): update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2))
* fix(ucd-store): improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e))
* fix(cli): print correct json output ([1807a7ce](https://github.com/ucdjs/ucd/commit/1807a7ce9a5daf696c7dcc6a67c688f7446907e5))
* fix(cli): refactor version selection logic in runInitStore ([907a4106](https://github.com/ucdjs/ucd/commit/907a4106033953252b577db2ea80471edcc93c4d))
* fix(cli): adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9))
* fix(cli): correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04))
* fix(analyze): correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead))
* fix(cli): handle version selection more robustly ([3fabe8a0](https://github.com/ucdjs/ucd/commit/3fabe8a0c7b7205c59818ff59864a2dd2525c199))
* fix(cli): handle version selection more robustly ([1aa8ea49](https://github.com/ucdjs/ucd/commit/1aa8ea49fd0c93964d8111324c642992a91f7a0b))
* fix: throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346))
* fix(cli): remove proxyUrl from clean, init, repair, and status commands ([0499e047](https://github.com/ucdjs/ucd/commit/0499e0472b05928fa8aec4a99dc2cffacad511d5))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* refactor(tests): simplify mock responses for API versioning ([79c16c9b](https://github.com/ucdjs/ucd/commit/79c16c9b02baacb21e944d480daf33b7b1a1304f))
* chore: switch to @unicode-utils/* (#374) ([#374](https://github.com/ucdjs/ucd/issues/374)) ([735ae595](https://github.com/ucdjs/ucd/commit/735ae595c099d97724007583a4a8a66cd9d5a4f9))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: fix tests ([4e338e73](https://github.com/ucdjs/ucd/commit/4e338e734657f5dad4a924ae8161f2ef058ab347))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* chore: fix rest of tests ([6a9a24fd](https://github.com/ucdjs/ucd/commit/6a9a24fd5bb97767ee558cfbd6e22c753a860aab))
* chore(tests): update import paths for test utilities ([05725fc0](https://github.com/ucdjs/ucd/commit/05725fc0b3687ea717ee589fd71faf403e31727e))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update devDependencies to use 'catalog:types' ([04277f87](https://github.com/ucdjs/ucd/commit/04277f879f4193da7f9d99711d8339ed9faae47f))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* chore: remove `p-limit` dependency across multiple packages ([a73147af](https://github.com/ucdjs/ucd/commit/a73147af43a01492e36e97b2403f565b5835dcd3))
* refactor(ucd-store): improve error handling in analyze method ([1486a78d](https://github.com/ucdjs/ucd/commit/1486a78dd6d36b7cfa3b2c7f0908c98b858ea532))
* test: update mockFetch calls to remove redundant HEAD requests ([61b4a3f9](https://github.com/ucdjs/ucd/commit/61b4a3f9e9cdfb36d9e789e0a1ff6d2270e6ac04))
* chore: migrate test-utils-internal to internal alias ([2cd82c0d](https://github.com/ucdjs/ucd/commit/2cd82c0d2c052572349a85946aca560b7bb8b212))
* chore: fix imports ([162de26f](https://github.com/ucdjs/ucd/commit/162de26f4a95f541359e8e6cd5a997c597398e6f))
* chore: update pnpm workspace and add test utils package ([80e2d592](https://github.com/ucdjs/ucd/commit/80e2d5920f851ea557ab45fdfa31c6a7d9d095ac))
* chore: refactor imports to use #test-utils for consistency ([280d8ea9](https://github.com/ucdjs/ucd/commit/280d8ea965d959addf41a43d20fe3918189326cd))
* chore: fix ([6b31958b](https://github.com/ucdjs/ucd/commit/6b31958bbb66b2bf0322e0da733be6b45956b0b1))
* chore: fix cli test ([557b22a6](https://github.com/ucdjs/ucd/commit/557b22a6b5c01b8cd883247ca12146a17f43a77b))
* test(cli): add mock readable & writable ([98bcc08a](https://github.com/ucdjs/ucd/commit/98bcc08afe88bb9648f858c246883a3090594462))
* chore: add dev script to cli ([8d50e6cd](https://github.com/ucdjs/ucd/commit/8d50e6cd4f18ad1cccdc150fd7cbbec4280b6cba))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* Merge branch 'main' into store-analyze ([ea3b7f74](https://github.com/ucdjs/ucd/commit/ea3b7f7451e1d658d3adbcb8e01983111a37cfa9))
* chore(eslint): refactor ESLint configuration across multiple packages ([4924a4c8](https://github.com/ucdjs/ucd/commit/4924a4c8d1d1296fa6717b278e695d05450b2f5a))
* refactor(cli): improve error handling and version selection in init command ([09eb17c7](https://github.com/ucdjs/ucd/commit/09eb17c7db2553f3334a73f90299d8f4ab1f3196))
* chore: add clack prompts ([c03cc60b](https://github.com/ucdjs/ucd/commit/c03cc60b314b06caab2c3e1b168a1d6424a3ea53))
* refactor(cli): improve error handling and version selection in init command ([be5bd5ec](https://github.com/ucdjs/ucd/commit/be5bd5eca4eea0c214faad42655694bc652fbc09))
* chore: add clack prompts ([9adfb0b0](https://github.com/ucdjs/ucd/commit/9adfb0b004ef41a144ce3849f3f33c2e326febb4))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore: refactor UCD store commands and remove unused files ([8db61c64](https://github.com/ucdjs/ucd/commit/8db61c6412ab14bc4f9f8a3daacae883ca49dbd5))
* remove proxy-related configurations and references ([5f267695](https://github.com/ucdjs/ucd/commit/5f267695070d8e75de6a31a053fdd47737c74f01))
* chore: update node engine version across packages ([315a422d](https://github.com/ucdjs/ucd/commit/315a422d589bf277cb99cd313a693baed973da75))
* chore: update dependencies ([a1d2a3a7](https://github.com/ucdjs/ucd/commit/a1d2a3a7638baf44d4b03062b0070ba7bf7e0222))
* chore: lint ([c8c67d4b](https://github.com/ucdjs/ucd/commit/c8c67d4b3f8270afaac58244e815103027a05c45))
* chore: update package versions in pnpm-workspace.yaml ([9dde454c](https://github.com/ucdjs/ucd/commit/9dde454c84169dcb5a6fc5b82215602fc0a8c243))
* chore: refactor tsdown configuration across packages ([323318de](https://github.com/ucdjs/ucd/commit/323318def2095643c3062fb863c78f1942ac1516))
* chore: update pnpm workspace configuration ([e0f3343e](https://github.com/ucdjs/ucd/commit/e0f3343ea1cb513b00c4d8921c8135d2118a4b35))
* refactor(store): replace `createUCDStore` with specific local and remote store creation functions ([4c824601](https://github.com/ucdjs/ucd/commit/4c824601f7bde6d24ad0afb5290023d39fd7227d))
* chore: lint ([bc9b2700](https://github.com/ucdjs/ucd/commit/bc9b270033d104917ba40ee2e77c3c40850fb49f))
* refactor: remove download command support from CLI and related tests ([b75b7567](https://github.com/ucdjs/ucd/commit/b75b7567f1df6da11b5ce917419c3f6870d11a80))
* chore: remove downloads cmd I will create a new PR which adds a new CLI for stores, that will be the new cli to use ([811b2772](https://github.com/ucdjs/ucd/commit/811b277208cda9d76974606a7694212fa663e89c))
* refactor: update imports to use utils package for PRECONFIGURED_FILTERS ([5ac735ab](https://github.com/ucdjs/ucd/commit/5ac735ab53f701b664575d2762442a4f19b35c46))
* chore: migrate to use tooling packages ([5b7cf43a](https://github.com/ucdjs/ucd/commit/5b7cf43aff5bba0701cda7043106f83b94082c39))
* chore: fix tests ([921ea71d](https://github.com/ucdjs/ucd/commit/921ea71d09f8a4c5863fc5031b77ee681fcdc8c3))
* chore: fix tests ([d1df97d2](https://github.com/ucdjs/ucd/commit/d1df97d2a9ff994503e9747c61d6b714123e1373))
* refactor: update download command to use patterns for file exclusion ([97241de4](https://github.com/ucdjs/ucd/commit/97241de4aea9a175ce9b51f8d17c2d926e6d3a8a))
* refactor: update filter patterns to use consistent naming for exclusion filters ([6b25c005](https://github.com/ucdjs/ucd/commit/6b25c00550812568759a370fc4c59c95daf5720d))
* refactor: enhance runDownload to filter out draft versions and update download patterns ([52c69999](https://github.com/ucdjs/ucd/commit/52c69999af219523ce3fae5e73b8d05facb9f3e1))
* refactor: remove unused file filtering options ([73cc0133](https://github.com/ucdjs/ucd/commit/73cc0133cb7b0eac8f22fdd23bcc3a099925764c))
* chore: update dependencies ([f262f3fc](https://github.com/ucdjs/ucd/commit/f262f3fc69d223097368fd8b69636225c4e983da))
* chore: remove duplicate flag ([33a23e48](https://github.com/ucdjs/ucd/commit/33a23e48593ac0eea5773378e88ca3b40026ae49))
* chore: remove cleanup ([275e6301](https://github.com/ucdjs/ucd/commit/275e63016d02f664d264c37847dc1e075d400e1e))
* chore: disable some tests I will create an issue for tracking test coverage, which these tests fall under ([ce43550a](https://github.com/ucdjs/ucd/commit/ce43550aac40932b1db65ed9786292b9d1e6882a))
* refactor: make cli use ucd-store to download files ([717e4b71](https://github.com/ucdjs/ucd/commit/717e4b71a7656e5b30dc30aef0d7ba03fbb88e5e))


## 0.3.0

### Minor Changes

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#66](https://github.com/ucdjs/ucd/pull/66) [`09fb839`](https://github.com/ucdjs/ucd/commit/09fb8396302428b395878110f9e593eacabae7b5) Thanks [@luxass](https://github.com/luxass)! - implement store command

- [#35](https://github.com/ucdjs/ucd/pull/35) [`a67a5b7`](https://github.com/ucdjs/ucd/commit/a67a5b75679dc8c4ba73743e5d6ffa2c18132439) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate cli to ucd-store download

### Patch Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- Updated dependencies [[`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f), [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31), [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946), [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f), [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea), [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0), [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12), [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e), [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/ucd-store@0.1.0
  - @ucdjs/schema-gen@0.2.2

## 0.2.2

### Patch Changes

- [#18](https://github.com/ucdjs/ucd/pull/18) [`24e8218`](https://github.com/ucdjs/ucd/commit/24e821845bf6a7b9c95b0db467b099440976c71c) Thanks [@luxass](https://github.com/luxass)! - feat: create comment files flag

## 0.2.1

### Patch Changes

- [#16](https://github.com/ucdjs/ucd/pull/16) [`846b18a`](https://github.com/ucdjs/ucd/commit/846b18a4ddf7c97062fc8367121809cd80950ab0) Thanks [@luxass](https://github.com/luxass)! - feat: add support for excluding draft in file download

## 0.2.0

### Minor Changes

- [#15](https://github.com/ucdjs/ucd/pull/15) [`24ce563`](https://github.com/ucdjs/ucd/commit/24ce563760b0efcf33ff9219d01868c195bb63ac) Thanks [@luxass](https://github.com/luxass)! - feat!: remove generate cmd in favor of the new download cmd

- [#13](https://github.com/ucdjs/ucd/pull/13) [`4e59266`](https://github.com/ucdjs/ucd/commit/4e592668e45fec9b15de0a1395708e694a9a8500) Thanks [@luxass](https://github.com/luxass)! - feat: add new download cmd

- [`381b40d`](https://github.com/ucdjs/ucd/commit/381b40d654c9c10d3c8b4f82bdeab3003b6a79d4) Thanks [@luxass](https://github.com/luxass)! - implement concurrency for codegen

### Patch Changes

- Updated dependencies [[`78f4673`](https://github.com/ucdjs/ucd/commit/78f4673657a210eb374a025dabe7450291712a0a)]:
  - @ucdjs/schema-gen@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`99eccc9`](https://github.com/ucdjs/ucd/commit/99eccc9bc76904e2e2b5c2233229857235841091)]:
  - @ucdjs/schema-gen@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`d55695d`](https://github.com/ucdjs/ucd/commit/d55695d16b6ec74953e2f2314500d70590eb5d1a)]:
  - @ucdjs/schema-gen@0.1.0

## 0.1.1

### Patch Changes

- [#3](https://github.com/ucdjs/ucd/pull/3) [`290e73d`](https://github.com/ucdjs/ucd/commit/290e73d29439c7102ead994f29b4d5797fb33eca) Thanks [@luxass](https://github.com/luxass)! - feat: enhance generate experience

## 0.1.0

### Minor Changes

- [#1](https://github.com/ucdjs/ucd/pull/1) [`bb3d880`](https://github.com/ucdjs/ucd/commit/bb3d880b8f824d5a2d7a9e0e627a94a6cc456355) Thanks [@luxass](https://github.com/luxass)! - feat: add generate cmd
