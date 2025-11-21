# @ucdjs/ucd-store-v2

## [0.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/ucd-store-v2@0.0.1...@ucdjs/ucd-store-v2@0.1.0) (2025-11-21)


### Features
* enhance mirroring functionality with concurrency and error handling ([ee7ddae0](https://github.com/ucdjs/ucd/commit/ee7ddae0269ab0ace36cc95693cf8f3c6ee3b5ad)) (by [@luxass](https://github.com/luxass))
* enhance getFileTree function to support local file retrieval and API fallback ([bff8a709](https://github.com/ucdjs/ucd/commit/bff8a709ea73e6e4686f66a8bd951b8d1bbb0a4a)) (by [@luxass](https://github.com/luxass))
* enhance getFile function to improve error handling and documentation ([b8c9ba4a](https://github.com/ucdjs/ucd/commit/b8c9ba4a1eca06cf229045d35b746e647d4d7646)) (by [@luxass](https://github.com/luxass))
* enhance listFiles function to support API fallback ([d3907a4c](https://github.com/ucdjs/ucd/commit/d3907a4cbd1eff52e4789dfe0c4b84bbd21850d2)) (by [@luxass](https://github.com/luxass))
* enhance listFiles function to prioritize local file system ([21b9428e](https://github.com/ucdjs/ucd/commit/21b9428e439de82820dc747f33e0a6d0d7cfcb47)) (by [@luxass](https://github.com/luxass))
* implement core functionalities for UCD store ([aca2769e](https://github.com/ucdjs/ucd/commit/aca2769ee9c67bf824a0c7788b06c17a4a8e2435)) (by [@luxass](https://github.com/luxass))
* add verification function for manifest versions ([44fa003e](https://github.com/ucdjs/ucd/commit/44fa003e1add01fdf8f39303429704ec7ce7406d)) (by [@luxass](https://github.com/luxass))
* implement bootstrap function for store initialization ([feb8421f](https://github.com/ucdjs/ucd/commit/feb8421f13922638c6a757e43af44880a7e52d45)) (by [@luxass](https://github.com/luxass))
* add functions to write and read UCD store manifest ([ae241979](https://github.com/ucdjs/ucd/commit/ae241979e4d8b7ec92069b66329149a5da4c3c13)) (by [@luxass](https://github.com/luxass))
* add custom error classes for UCD Store ([5ef3c1ed](https://github.com/ucdjs/ucd/commit/5ef3c1edf4929dcbda290a51ac927595f4dc8ded)) (by [@luxass](https://github.com/luxass))
* add dependencies and devDependencies for ucd-store-v2 package ([721dd79a](https://github.com/ucdjs/ucd/commit/721dd79abacd609662c3509c701d230f9eab0f35)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update `sync`, `mirror`, and `analyze` methods to reflect experimental status ([ea6f4d52](https://github.com/ucdjs/ucd/commit/ea6f4d5299da2276afe5189c2ebf14a1a3c9b9b3)) (by [@luxass](https://github.com/luxass))
* clamp index for byte size formatting to prevent out-of-bounds access ([d74b7099](https://github.com/ucdjs/ucd/commit/d74b7099686e8741a1c9e7b1bff7f04995f8cd8b)) (by [@luxass](https://github.com/luxass))
* ensure `versions` is immutable in internal context creation ([c3997317](https://github.com/ucdjs/ucd/commit/c3997317f33aff65d2873540cde2ea4cca647ec1)) (by [@luxass](https://github.com/luxass))
* update `UCDStoreInvalidManifestError` to accept structured error details ([b7dd6ee3](https://github.com/ucdjs/ucd/commit/b7dd6ee326a4b01eb09c68be2fe34805ba8711dc)) (by [@luxass](https://github.com/luxass))
* improve metrics calculations for success, failure, and cache hit rates ([4fa860e4](https://github.com/ucdjs/ucd/commit/4fa860e43481e3375531322a2c367e62cd9a2f6c)) (by [@luxass](https://github.com/luxass))
* add error handling for missing HTTP FileSystemBridge ([8a48c1db](https://github.com/ucdjs/ucd/commit/8a48c1db6d2c4d4868c1ab3cede25fe9068f220a)) (by [@luxass](https://github.com/luxass))
* improve error message for invalid schema in `readManifest` ([b0f6e309](https://github.com/ucdjs/ucd/commit/b0f6e309594785b20d2c9c4153f459ef37a546c1)) (by [@luxass](https://github.com/luxass))
* update null check for data object validation ([3576a4dc](https://github.com/ucdjs/ucd/commit/3576a4dc66f123b1c02fc5323d06bffee84f907e)) (by [@luxass](https://github.com/luxass))
* improve data type validation for JSON content ([11374f9a](https://github.com/ucdjs/ucd/commit/11374f9ae650103f70493dfd0cea0b62cd0aff42)) (by [@luxass](https://github.com/luxass))
* update list and tree methods to use specific options types ([f3b5dbf6](https://github.com/ucdjs/ucd/commit/f3b5dbf6620fe311d5d5e577d28a8ec0cda3ef94)) (by [@luxass](https://github.com/luxass))
* remove unused variable in error handling tests ([52aa03b2](https://github.com/ucdjs/ucd/commit/52aa03b2bd1e1d3c05eef4cc81ecd3a121ea7eb5)) (by [@luxass](https://github.com/luxass))
* improve null check for result.data in listFiles and getFileTree ([a95a7e9c](https://github.com/ucdjs/ucd/commit/a95a7e9c4d687a72abe4409f23cb21f76820ca1d)) (by [@luxass](https://github.com/luxass))
* improve null check for result.data and stringify JSON response ([d05ed5d3](https://github.com/ucdjs/ucd/commit/d05ed5d389eaae2eb2fcf3d1a3d894e524d4bae1)) (by [@luxass](https://github.com/luxass))
* update mock API responses to return structured error objects ([ad67049c](https://github.com/ucdjs/ucd/commit/ad67049ccfabc54e7351353c3f8df31d4ff55de9)) (by [@luxass](https://github.com/luxass))
* ensure &#39;read:before&#39; hook is correctly set up ([e2831585](https://github.com/ucdjs/ucd/commit/e2831585ef825a2f11ba90bee18f1631a9c36804)) (by [@luxass](https://github.com/luxass))
* replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b)) (by [@luxass](https://github.com/luxass))

### Refactoring
* enhance sync operation with mirroring support and improved result structure ([8bbe1cd8](https://github.com/ucdjs/ucd/commit/8bbe1cd877878fce8dd2e3d7915af1bbc378550a)) (by [@luxass](https://github.com/luxass))
* improve error handling and response processing ([248a0dc4](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0)) (by [@luxass](https://github.com/luxass))
* enhance Mirror reporting structure and metrics ([c32dc815](https://github.com/ucdjs/ucd/commit/c32dc81526c229b98c931638add48dfc6212c43f)) (by [@luxass](https://github.com/luxass))
* update Mirror interfaces and types for improved clarity ([f32b2780](https://github.com/ucdjs/ucd/commit/f32b2780f289cc058472bd964a6324fd94fa7c1f)) (by [@luxass](https://github.com/luxass))
* restructure analysis reporting interfaces ([49dc5596](https://github.com/ucdjs/ucd/commit/49dc5596f1f9fd07f8c145e09c44d91fc144deb8)) (by [@luxass](https://github.com/luxass))
* extend AnalyzeOptions with SharedOperationOptions ([84c4dc1e](https://github.com/ucdjs/ucd/commit/84c4dc1e0f297bd7f1ed1f3fd60a9049c99abcf2)) (by [@luxass](https://github.com/luxass))
* reorganize and enhance file operations tests ([3db7c109](https://github.com/ucdjs/ucd/commit/3db7c1092b890881bcf498b4c583f95aa82cfaab)) (by [@luxass](https://github.com/luxass))

### Documentation
* update documentation for `listFiles` to include API fallback behavior ([a2a5cf2f](https://github.com/ucdjs/ucd/commit/a2a5cf2fd919d51119c51aa4f16f9057ecaf6497)) (by [@luxass](https://github.com/luxass))


## 0.0.1

### Patch Changes

- Updated dependencies [[`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4), [`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119), [`ce9b5a7`](https://github.com/ucdjs/ucd/commit/ce9b5a76795292aca5c9f8b6fd7021a66a34c28d), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3), [`46a6e81`](https://github.com/ucdjs/ucd/commit/46a6e8110dcc1ccef3a436bb18e67d92f0424213), [`7d98e29`](https://github.com/ucdjs/ucd/commit/7d98e29af2f9f6d681f9f2ee401baddf5a2c6ef6), [`2a44473`](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2), [`4fd46b4`](https://github.com/ucdjs/ucd/commit/4fd46b43613b23c1d120c71ae0754883eb9bf1ff), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b), [`39faaf5`](https://github.com/ucdjs/ucd/commit/39faaf585f3339296ef75c8a39893399ea48789f), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640), [`170bbd1`](https://github.com/ucdjs/ucd/commit/170bbd1a8cfe23787d73e1052108261bb5956d01), [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234)]:
  - @ucdjs/fs-bridge@0.1.0
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/client@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0
