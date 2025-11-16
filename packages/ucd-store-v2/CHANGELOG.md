# @ucdjs/ucd-store-v2

## [0.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/ucd-store-v2@0.0.1...@ucdjs/ucd-store-v2@0.1.0) (2025-11-16)

### Features

* feat(ucd-store-v2): enhance mirroring functionality with concurrency and error handling ([ee7ddae0](https://github.com/ucdjs/ucd/commit/ee7ddae0269ab0ace36cc95693cf8f3c6ee3b5ad))
* feat(ucd-store-v2): enhance getFileTree function to support local file retrieval and API fallback ([bff8a709](https://github.com/ucdjs/ucd/commit/bff8a709ea73e6e4686f66a8bd951b8d1bbb0a4a))
* feat(ucd-store-v2): enhance getFile function to improve error handling and documentation ([b8c9ba4a](https://github.com/ucdjs/ucd/commit/b8c9ba4a1eca06cf229045d35b746e647d4d7646))
* feat(ucd-store-v2): enhance listFiles function to support API fallback ([d3907a4c](https://github.com/ucdjs/ucd/commit/d3907a4cbd1eff52e4789dfe0c4b84bbd21850d2))
* feat(ucd-store-v2): enhance listFiles function to prioritize local file system ([21b9428e](https://github.com/ucdjs/ucd/commit/21b9428e439de82820dc747f33e0a6d0d7cfcb47))
* feat(ucd-store-v2): implement core functionalities for UCD store ([aca2769e](https://github.com/ucdjs/ucd/commit/aca2769ee9c67bf824a0c7788b06c17a4a8e2435))
* feat(ucd-store-v2): add verification function for manifest versions ([44fa003e](https://github.com/ucdjs/ucd/commit/44fa003e1add01fdf8f39303429704ec7ce7406d))
* feat(ucd-store-v2): implement bootstrap function for store initialization ([feb8421f](https://github.com/ucdjs/ucd/commit/feb8421f13922638c6a757e43af44880a7e52d45))
* feat(ucd-store-v2): add functions to write and read UCD store manifest ([ae241979](https://github.com/ucdjs/ucd/commit/ae241979e4d8b7ec92069b66329149a5da4c3c13))
* feat(ucd-store-v2): add custom error classes for UCD Store ([5ef3c1ed](https://github.com/ucdjs/ucd/commit/5ef3c1edf4929dcbda290a51ac927595f4dc8ded))
* feat(ucd-store-v2): add dependencies and devDependencies for ucd-store-v2 package ([721dd79a](https://github.com/ucdjs/ucd/commit/721dd79abacd609662c3509c701d230f9eab0f35))

### Bug Fixes

* fix(ucd-store-v2): update `sync`, `mirror`, and `analyze` methods to reflect experimental status ([ea6f4d52](https://github.com/ucdjs/ucd/commit/ea6f4d5299da2276afe5189c2ebf14a1a3c9b9b3))
* fix(ucd-store-v2): clamp index for byte size formatting to prevent out-of-bounds access ([d74b7099](https://github.com/ucdjs/ucd/commit/d74b7099686e8741a1c9e7b1bff7f04995f8cd8b))
* fix(ucd-store-v2): ensure `versions` is immutable in internal context creation ([c3997317](https://github.com/ucdjs/ucd/commit/c3997317f33aff65d2873540cde2ea4cca647ec1))
* fix(ucd-store-v2): update `UCDStoreInvalidManifestError` to accept structured error details ([b7dd6ee3](https://github.com/ucdjs/ucd/commit/b7dd6ee326a4b01eb09c68be2fe34805ba8711dc))
* fix(ucd-store-v2): improve metrics calculations for success, failure, and cache hit rates ([4fa860e4](https://github.com/ucdjs/ucd/commit/4fa860e43481e3375531322a2c367e62cd9a2f6c))
* fix(ucd-store-v2): add error handling for missing HTTP FileSystemBridge ([8a48c1db](https://github.com/ucdjs/ucd/commit/8a48c1db6d2c4d4868c1ab3cede25fe9068f220a))
* fix(ucd-store-v2): improve error message for invalid schema in `readManifest` ([b0f6e309](https://github.com/ucdjs/ucd/commit/b0f6e309594785b20d2c9c4153f459ef37a546c1))
* fix(ucd-store-v2): update null check for data object validation ([3576a4dc](https://github.com/ucdjs/ucd/commit/3576a4dc66f123b1c02fc5323d06bffee84f907e))
* fix(ucd-store-v2): improve data type validation for JSON content ([11374f9a](https://github.com/ucdjs/ucd/commit/11374f9ae650103f70493dfd0cea0b62cd0aff42))
* fix(ucd-store-v2): update list and tree methods to use specific options types ([f3b5dbf6](https://github.com/ucdjs/ucd/commit/f3b5dbf6620fe311d5d5e577d28a8ec0cda3ef94))
* fix(ucd-store-v2): remove unused variable in error handling tests ([52aa03b2](https://github.com/ucdjs/ucd/commit/52aa03b2bd1e1d3c05eef4cc81ecd3a121ea7eb5))
* fix(ucd-store-v2): improve null check for result.data in listFiles and getFileTree ([a95a7e9c](https://github.com/ucdjs/ucd/commit/a95a7e9c4d687a72abe4409f23cb21f76820ca1d))
* fix(ucd-store-v2): improve null check for result.data and stringify JSON response ([d05ed5d3](https://github.com/ucdjs/ucd/commit/d05ed5d389eaae2eb2fcf3d1a3d894e524d4bae1))
* fix(ucd-store-v2): update mock API responses to return structured error objects ([ad67049c](https://github.com/ucdjs/ucd/commit/ad67049ccfabc54e7351353c3f8df31d4ff55de9))
* fix(ucd-store-v2): ensure 'read:before' hook is correctly set up ([e2831585](https://github.com/ucdjs/ucd/commit/e2831585ef825a2f11ba90bee18f1631a9c36804))
* fix: replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* test(ucd-store-v2): change response format from json to text for wildcard API ([fbb5adb1](https://github.com/ucdjs/ucd/commit/fbb5adb11e0aa006b6fa4d87c6331ad7e4bbe279))
* test(ucd-store-v2): enhance concurrency limit handling in tests ([1c7e907d](https://github.com/ucdjs/ucd/commit/1c7e907df5a15da47068bf2cd9fb1aefc7965168))
* test(ucd-store-v2): update `unchanged` versions in test to reflect new logic for add strategy ([4ee7f80c](https://github.com/ucdjs/ucd/commit/4ee7f80cc9a51f4bda7e453cbb0e76fc627ebd2b))
* docs(ucd-store-v2): update documentation for `listFiles` to include API fallback behavior ([a2a5cf2f](https://github.com/ucdjs/ucd/commit/a2a5cf2fd919d51119c51aa4f16f9057ecaf6497))
* test(ucd-store-v2): replace `fs.on` with `fs.hook` for read and list operations ([b267dd24](https://github.com/ucdjs/ucd/commit/b267dd24db553beda264a264e31a351b1995663a))
* Potential fix for pull request finding 'Comparison between inconvertible types' ([057fb8df](https://github.com/ucdjs/ucd/commit/057fb8df16606b6be85d848383c5f544ebf7a1c5))
* test(ucd-store-v2): remove timestamp validation from mirror test ([40c835ed](https://github.com/ucdjs/ucd/commit/40c835ed49e6621f9a6296585277650786818ee8))
* test(ucd-store-v2): fix file paths in `getExpectedFilePaths` tests ([2af9ac21](https://github.com/ucdjs/ucd/commit/2af9ac21ae134713c095795608717c358c767fab))
* refactor(ucd-store-v2): enhance sync operation with mirroring support and improved result structure ([8bbe1cd8](https://github.com/ucdjs/ucd/commit/8bbe1cd877878fce8dd2e3d7915af1bbc378550a))
* refactor(ucd-store-v2): improve error handling and response processing ([248a0dc4](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0))
* refactor(ucd-store-v2): enhance Mirror reporting structure and metrics ([c32dc815](https://github.com/ucdjs/ucd/commit/c32dc81526c229b98c931638add48dfc6212c43f))
* refactor(ucd-store-v2): update Mirror interfaces and types for improved clarity ([f32b2780](https://github.com/ucdjs/ucd/commit/f32b2780f289cc058472bd964a6324fd94fa7c1f))
* test(ucd-store-v2): update analyze tests to use new AnalysisReport structure ([f9dedbe3](https://github.com/ucdjs/ucd/commit/f9dedbe37d285d66ea7bff12d22de2c8ccd48165))
* refactor(ucd-store-v2): restructure analysis reporting interfaces ([49dc5596](https://github.com/ucdjs/ucd/commit/49dc5596f1f9fd07f8c145e09c44d91fc144deb8))
* test: remove type assertion from mock file tree response ([443defcb](https://github.com/ucdjs/ucd/commit/443defcbeb90c617c5945cc5fb475f966fdb3938))
* chore: rename error ([d3046765](https://github.com/ucdjs/ucd/commit/d3046765ec44c5d89367ed2d4dbe96326cae8b66))
* refactor(ucd-store-v2): extend AnalyzeOptions with SharedOperationOptions ([84c4dc1e](https://github.com/ucdjs/ucd/commit/84c4dc1e0f297bd7f1ed1f3fd60a9049c99abcf2))
* refactor(ucd-store-v2): reorganize and enhance file operations tests ([3db7c109](https://github.com/ucdjs/ucd/commit/3db7c1092b890881bcf498b4c583f95aa82cfaab))
* test(ucd-store-v2): refactor tests for local file retrieval and error handling ([4f5a79b8](https://github.com/ucdjs/ucd/commit/4f5a79b85d70b58287df9fb3ca83ecfe6500d662))
* chore: lint ([7370e57f](https://github.com/ucdjs/ucd/commit/7370e57f0678498360d4c1ca8ffc518513845715))
* test(ucd-store-v2): add comprehensive tests for analyze operation ([6c190c17](https://github.com/ucdjs/ucd/commit/6c190c1753206348ef1600115d4375e6ffd64bb8))
* test(ucd-store-v2): add comprehensive tests for custom error classes ([42d31760](https://github.com/ucdjs/ucd/commit/42d31760a79891cca1f119fc58c7e83a99bfae85))
* test(ucd-store-v2): replace mock configuration with `getDefaultUCDEndpointConfig` ([9c8e48ed](https://github.com/ucdjs/ucd/commit/9c8e48ed04e6a4d6f8d11e0661772d5f43671e28))
* test(ucd-store-v2): refactor tests for getFileTree function ([c8b7d268](https://github.com/ucdjs/ucd/commit/c8b7d2680134615d293f9b69eabc8a9f455cf974))
* test(ucd-store-v2): add tests for getExpectedFilePaths function ([f840e810](https://github.com/ucdjs/ucd/commit/f840e8102555eec808ff9a34a1e1e229a5c9b8de))
* test(ucd-store-v2): enhance file tree validation in tests ([2f338f35](https://github.com/ucdjs/ucd/commit/2f338f355d9ebe3999b9f36622ee8eb20908dff4))
* test(ucd-store-v2): update error handling in file retrieval tests ([a60ebc36](https://github.com/ucdjs/ucd/commit/a60ebc3643445f3f4c040cc1a099c5837c301aae))
* test(ucd-store-v2): enhance filter validation and error handling ([938665bd](https://github.com/ucdjs/ucd/commit/938665bd6e44731fed2eb940fa7924e1f2bc292f))
* test(ucd-store-v2): simplify version validation and error handling tests ([1444ce0f](https://github.com/ucdjs/ucd/commit/1444ce0f48c463807837ceec2721935d7b1f89a2))
* test(ucd-store-v2): improve comments and simplify mock API responses ([9fff83a4](https://github.com/ucdjs/ucd/commit/9fff83a44907099fe0678324413f3fa68c0adbe4))
* test(ucd-store-v2): update import paths for mockStoreApi in test files ([25d27aae](https://github.com/ucdjs/ucd/commit/25d27aaef12e12c2a2722495510a9515bf5e65b1))
* test(ucd-store-v2): update API response handling and caching logic ([e7b0e3da](https://github.com/ucdjs/ucd/commit/e7b0e3da63ae4c16ef331679a3c7cdf21678f5da))
* test(ucd-store-v2): extend mockStoreApi to verify API call count ([717502db](https://github.com/ucdjs/ucd/commit/717502dba61dab6bf3d2ffe2a2629e1b06ec215c))
* chore: format ([b8ecb208](https://github.com/ucdjs/ucd/commit/b8ecb20836f2980f3121af14d010b2a7967c0f27))
* test(ucd-store-v2): update mock API responses to use path parameters ([9be59336](https://github.com/ucdjs/ucd/commit/9be593362aef7356d2f09bf57e62ebd86f7f67b5))
* chore: dump claude tests ([81d5a64c](https://github.com/ucdjs/ucd/commit/81d5a64c438a70deecad0aefd415a97b788e0a0b))
* chore: lint ([237b7d22](https://github.com/ucdjs/ucd/commit/237b7d229b56ccc56f55241eff9f05071d867f51))
* test(ucd-store-v2): add unit tests for createInternalContext and createPublicContext ([a4541b87](https://github.com/ucdjs/ucd/commit/a4541b8771200e6009538d8d01f3343ee9d92710))
* test(ucd-store-v2): add tests for version conflict handling strategies ([9349d408](https://github.com/ucdjs/ucd/commit/9349d4087a5c9c6e743cb7b70c665bd8055a4c8c))
* test(ucd-store-v2): add unit tests for verify function ([7a1bafc8](https://github.com/ucdjs/ucd/commit/7a1bafc86b6c14f2f06c41f56b42a156b5477929))
* test(ucd-store-v2): add tests for bootstrap functionality ([bf21e318](https://github.com/ucdjs/ucd/commit/bf21e318bbfb46594400877ef1a1d67c7f5e7edb))
* test(ucd-store-v2): add comprehensive tests for write and read manifest functions ([3f685ccc](https://github.com/ucdjs/ucd/commit/3f685ccc8eda43a9416d214b829935602f90c955))
* chore: switch to @unicode-utils/* (#374) ([#374](https://github.com/ucdjs/ucd/issues/374)) ([735ae595](https://github.com/ucdjs/ucd/commit/735ae595c099d97724007583a4a8a66cd9d5a4f9))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* chore: remove unused dependency ([2d2efa23](https://github.com/ucdjs/ucd/commit/2d2efa23b360b763159772895f2ca3f79a0c5389))


## 0.0.1

### Patch Changes

- Updated dependencies [[`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4), [`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119), [`ce9b5a7`](https://github.com/ucdjs/ucd/commit/ce9b5a76795292aca5c9f8b6fd7021a66a34c28d), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3), [`46a6e81`](https://github.com/ucdjs/ucd/commit/46a6e8110dcc1ccef3a436bb18e67d92f0424213), [`7d98e29`](https://github.com/ucdjs/ucd/commit/7d98e29af2f9f6d681f9f2ee401baddf5a2c6ef6), [`2a44473`](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2), [`4fd46b4`](https://github.com/ucdjs/ucd/commit/4fd46b43613b23c1d120c71ae0754883eb9bf1ff), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b), [`39faaf5`](https://github.com/ucdjs/ucd/commit/39faaf585f3339296ef75c8a39893399ea48789f), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640), [`170bbd1`](https://github.com/ucdjs/ucd/commit/170bbd1a8cfe23787d73e1052108261bb5956d01), [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234)]:
  - @ucdjs/fs-bridge@0.1.0
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/client@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0
