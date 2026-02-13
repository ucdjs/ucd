# @ucdjs/cli

## 0.4.0




### &nbsp;&nbsp;&nbsp;🚀 Features

- update dependencies and enhance lockfile path handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(7d925743)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)- add file management commands to CLI &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(40b8d0ce)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/40b8d0ce98b4564041ece612c9f31183013740a7)- add write capability assertion and enhance store commands &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a2eb3cd5)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)- implement shared flags and enhance store commands with clean, repair, and status functionalities &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(333a90c6)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303)- add store commands for clean, repair, status, and validate &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ed47d40a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ed47d40a7e3b7dd4413c068469abc2cc1aec6474)- add store command &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0ba52fac)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0ba52fac19f587fc8428c07580424d7861fdc298)- add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(48dad498)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)- add HTML and README file exclusion options to download command &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(36d1bc0e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/36d1bc0ee832e67f211613b0d962dc86a2b0fb3f)- enhance error reporting in download process and update exclusion patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a5773700)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588)- enable tsdown exports &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8d890cb3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a)
- **cli**:
      - add &#39;validate&#39; subcommand for lockfile validation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(229a1e2c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/229a1e2c3071e25b331e5935aa2462d27209af07)    - add &#39;info&#39; subcommand for lockfile details &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d930a9d1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d930a9d1eac7bc16103f76ba831a62f7872854f6)    - add hash subcommand for computing file hashes &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b24a3d0e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b24a3d0e43314832659d8459bda59c479fbd234e)    - add lockfile command for UCD store management &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0cd6ea05)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0cd6ea051f7bfd2ebd6f788fb3a4bb1364198e7c)    - add CLIError class for improved error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f74a2692)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f74a2692cb8f6eac86f36d04470107b930fb8bdb)    - update file listing to use FileEntryList type &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(25443c68)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/25443c6866333bcf2dd87e26210a3dd66731acbe)    - refactor output logging and formatBytes function &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0e97978a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0e97978a81401b10efeb9005e903be9089cc4fca)    - update output logging for file operations &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(371f9665)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/371f96659684fee3183bf67d3abfd9256aac7b8b)    - enhance output functions and add new utilities &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9e870450)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9e870450b3309a69aa4f4247a309aed521f2d1ce)    - migrate from `@ucdjs/ucd-store-v2` to `@ucdjs/ucd-store` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f7538ad8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f7538ad8da9de36835b0dbc14d2e0bfc711e154b)    - improve debug logs &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(7632426c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/7632426cd3e43c4d8db5cf1b3090c08061710b07)    - add info subcommand to files cmd &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(33e8dcab)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/33e8dcabeee69978fc1fd770475f12e01e90076d)    - use stderr for casual logs when paired with --json &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(904dd049)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/904dd0497130f1450e6bc6d9e5bd8da43abfd436)    - fix analyze type errors and resolve double directory path issue &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1edd1365)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1edd13650034928df9453ecd4ed9f3411c3f6de8)    - redesign store commands for ucd-store-v2 API &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a5e12a5e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a5e12a5ed045d68a43dedc8e0df5f3f817ef4239)    - enhance store initialization with dry-run mode and add tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4aee44b0)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4aee44b0cd9449df80e50bdd930ef50c64c8ebe7)    - add analyze command for UCD store &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b22886ad)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b22886ade9f28bc6f0a8e54f29328376a0a53eec)    - enhance CLI store command with version selection &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9caa6a34)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9caa6a347138f2f3ec5ec20324c4bca82685ad68)    - enhance CLI store command with version selection &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(27db542d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/27db542d96bd9b9f4f64dcecdf0bad52ff864bf1)    - add &#39;dev:api&#39; script for API development &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b9c3b2ba)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)  - **shared**:
      - update CLIStoreCmdSharedFlags to use include/exclude patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(3a90b66d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/3a90b66dd211f4c4a2608837a4d550ace7a10f73)  - **ucd-store**:
      - add UCDStoreInvalidManifestError and improve error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(69d3d780)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)  
### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- throw if unresolved import &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8123dda2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)
- **cli**:
      - change console method from info to log in help command test &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4b0cb662)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4b0cb6623a2496afdcab1174fc959938d39d6885)    - improve mirror command &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(27990106)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2799010628d9525988907cab4ade90b5e367fbfd)    - handle include &amp; exclude as arrays &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ba7723f2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ba7723f2fe6bca0ccf79170770bd5330908f8bd0)    - update dependency from `@luxass/unicode-utils-old` to `@luxass/unicode-utils` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b5d2405b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b5d2405b9993896b207275e4b95b15f75dc872f3)    - print correct json output &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1807a7ce)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1807a7ce9a5daf696c7dcc6a67c688f7446907e5)    - refactor version selection logic in runInitStore &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(907a4106)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/907a4106033953252b577db2ea80471edcc93c4d)    - adjust argument indexing for store commands &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e7c8839d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9)    - correct command argument indexing and improve process title &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d7446ff2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04)    - handle version selection more robustly &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(3fabe8a0)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/3fabe8a0c7b7205c59818ff59864a2dd2525c199)    - handle version selection more robustly &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1aa8ea49)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1aa8ea49fd0c93964d8111324c642992a91f7a0b)    - remove proxyUrl from clean, init, repair, and status commands &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0499e047)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0499e0472b05928fa8aec4a99dc2cffacad511d5)  - **cli, schema-gen**:
      - update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(46b62b64)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2)  - **ucd-store**:
      - improve error handling in store analysis &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c554d2ac)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e)  - **analyze**:
      - correct log message for analyzing versions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8404d3bf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead)  
### &nbsp;&nbsp;&nbsp;Refactoring

- reorganize pnpm catalogs for better scoping &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ba721776)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ba721776cf6fad9cdae2ba9617e52fca7dff1499)- update type definitions and clean up imports across multiple files &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f7f602a2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f7f602a27fc5aa64677b2dddc2f6a96da81adfe9)- update tsconfig references to use @ucdjs-tooling/tsconfig &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e5c39ac8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)- remove download command support from CLI and related tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b75b7567)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b75b7567f1df6da11b5ce917419c3f6870d11a80)- update imports to use utils package for PRECONFIGURED_FILTERS &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5ac735ab)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5ac735ab53f701b664575d2762442a4f19b35c46)- update download command to use patterns for file exclusion &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(97241de4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/97241de4aea9a175ce9b51f8d17c2d926e6d3a8a)- update filter patterns to use consistent naming for exclusion filters &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6b25c005)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6b25c00550812568759a370fc4c59c95daf5720d)- enhance runDownload to filter out draft versions and update download patterns &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(52c69999)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/52c69999af219523ce3fae5e73b8d05facb9f3e1)- remove unused file filtering options &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(73cc0133)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/73cc0133cb7b0eac8f22fdd23bcc3a099925764c)- make cli use ucd-store to download files &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(717e4b71)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/717e4b71a7656e5b30dc30aef0d7ba03fbb88e5e)
- **cli**:
      - streamline store status, sync, and verify commands &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9a8a375e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9a8a375eddc9226b4e791c5d2ed4040386b3df98)    - improve error handling and reporting structure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(7145af3e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/7145af3eea757ae304c3ad7e76f740d0054d1fab)    - improve command output and structure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(998edb0e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/998edb0e99fca35055507db76bfacafc466b573d)    - improve error handling and version selection in init command &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(09eb17c7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/09eb17c7db2553f3334a73f90299d8f4ab1f3196)    - improve error handling and version selection in init command &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(be5bd5ec)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/be5bd5eca4eea0c214faad42655694bc652fbc09)  - **ucd-store**:
      - enhance mirroring logic and file handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(968a73f7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/968a73f705d502724e1b2b42c9411129a6ddf77a)    - improve error handling in analyze method &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1486a78d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1486a78dd6d36b7cfa3b2c7f0908c98b858ea532)  - **env**:
      - rename UCD_FILE_STAT_TYPE_HEADER to UCD_STAT_TYPE_HEADER in tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c32b1870)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c32b187098b835f96a0f32a9edd6ff0deef32b4e)    - rename UCD_FILE_STAT_TYPE_HEADER to UCD_STAT_TYPE_HEADER &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0e4303fc)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0e4303fc943301ecbec5316951fc456729fb5fd1)  - **tests**:
      - simplify mock responses for API versioning &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(79c16c9b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/79c16c9b02baacb21e944d480daf33b7b1a1304f)  - **tsdown-config**:
      - update package references to @ucdjs-tooling/tsdown-config &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ccc002da)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)  - **store**:
      - replace `createUCDStore` with specific local and remote store creation functions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4c824601)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4c824601f7bde6d24ad0afb5290023d39fd7227d)  
### &nbsp;&nbsp;&nbsp;Tests

- apply changes to make tests work in vitest v4 &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(27d60cfd)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/27d60cfd1a77cdf0a75766234f7d65dbd9f94c28)- update mockFetch calls to remove redundant HEAD requests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(61b4a3f9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/61b4a3f9e9cdfb36d9e789e0a1ff6d2270e6ac04)
- **cli**:
      - add tests for lockfile hash, info, and validate commands &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0b7da9de)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0b7da9de4d91d961bce4dcd0a6a9ac92d65dff15)    - update console output capture from info to log &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d6a95559)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d6a955597ef537158acd60817796eaa12acccd24)    - remove `info` capture from ConsoleOutputCapture &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f961e441)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f961e441b388f7dd9bbd246951fc69de94ad1c21)    - add more test files &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(487f5422)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/487f54226b1ab5a2a4d7316612db163a8d204de3)    - add more cli tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9b68b3e2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9b68b3e2d83fa14f7a183345ec57607d183eeeb9)    - add init tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ab7e8211)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ab7e8211ae484be3b22ee8c6463e3c0fce94849e)    - add mirror tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(044361a5)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/044361a5cee500e156d003fc27cd9a7766fb00a8)    - add mock readable &amp; writable &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(98bcc08a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/98bcc08afe88bb9648f858c246883a3090594462)  


##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/v0.3.0...v0.4.0)

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
