# @ucdjs/cli

## [0.4.0](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.0...@ucdjs/cli@0.4.0) (2025-11-16)

### undefined

* refactor(tests): simplify mock responses for API versioning ([79c16c9b](https://github.com/ucdjs/ucd/commit/79c16c9b02baacb21e944d480daf33b7b1a1304f))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* refactor(ucd-store): improve error handling in analyze method ([1486a78d](https://github.com/ucdjs/ucd/commit/1486a78dd6d36b7cfa3b2c7f0908c98b858ea532))
* refactor(cli): improve error handling and version selection in init command ([09eb17c7](https://github.com/ucdjs/ucd/commit/09eb17c7db2553f3334a73f90299d8f4ab1f3196))
* refactor(cli): improve error handling and version selection in init command ([be5bd5ec](https://github.com/ucdjs/ucd/commit/be5bd5eca4eea0c214faad42655694bc652fbc09))
* refactor(store): replace `createUCDStore` with specific local and remote store creation functions ([4c824601](https://github.com/ucdjs/ucd/commit/4c824601f7bde6d24ad0afb5290023d39fd7227d))
* refactor: remove download command support from CLI and related tests ([b75b7567](https://github.com/ucdjs/ucd/commit/b75b7567f1df6da11b5ce917419c3f6870d11a80))
* refactor: update imports to use utils package for PRECONFIGURED_FILTERS ([5ac735ab](https://github.com/ucdjs/ucd/commit/5ac735ab53f701b664575d2762442a4f19b35c46))
* refactor: update download command to use patterns for file exclusion ([97241de4](https://github.com/ucdjs/ucd/commit/97241de4aea9a175ce9b51f8d17c2d926e6d3a8a))
* refactor: update filter patterns to use consistent naming for exclusion filters ([6b25c005](https://github.com/ucdjs/ucd/commit/6b25c00550812568759a370fc4c59c95daf5720d))
* refactor: enhance runDownload to filter out draft versions and update download patterns ([52c69999](https://github.com/ucdjs/ucd/commit/52c69999af219523ce3fae5e73b8d05facb9f3e1))
* refactor: remove unused file filtering options ([73cc0133](https://github.com/ucdjs/ucd/commit/73cc0133cb7b0eac8f22fdd23bcc3a099925764c))
* refactor: make cli use ucd-store to download files ([717e4b71](https://github.com/ucdjs/ucd/commit/717e4b71a7656e5b30dc30aef0d7ba03fbb88e5e))

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

### Miscellaneous

* Merge branch 'main' into store-analyze ([ea3b7f74](https://github.com/ucdjs/ucd/commit/ea3b7f7451e1d658d3adbcb8e01983111a37cfa9))
* remove proxy-related configurations and references ([5f267695](https://github.com/ucdjs/ucd/commit/5f267695070d8e75de6a31a053fdd47737c74f01))
