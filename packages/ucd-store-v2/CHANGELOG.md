# @ucdjs/ucd-store-v2

## [0.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/ucd-store-v2@0.0.1...@ucdjs/ucd-store-v2@0.1.0) (2025-11-16)

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

### docs

* docs(ucd-store-v2): update documentation for `listFiles` to include API fallback behavior ([a2a5cf2f](https://github.com/ucdjs/ucd/commit/a2a5cf2fd919d51119c51aa4f16f9057ecaf6497))

### Miscellaneous

* Potential fix for pull request finding 'Comparison between inconvertible types' ([057fb8df](https://github.com/ucdjs/ucd/commit/057fb8df16606b6be85d848383c5f544ebf7a1c5))

### refactor

* refactor(ucd-store-v2): enhance sync operation with mirroring support and improved result structure ([8bbe1cd8](https://github.com/ucdjs/ucd/commit/8bbe1cd877878fce8dd2e3d7915af1bbc378550a))
* refactor(ucd-store-v2): improve error handling and response processing ([248a0dc4](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0))
* refactor(ucd-store-v2): enhance Mirror reporting structure and metrics ([c32dc815](https://github.com/ucdjs/ucd/commit/c32dc81526c229b98c931638add48dfc6212c43f))
* refactor(ucd-store-v2): update Mirror interfaces and types for improved clarity ([f32b2780](https://github.com/ucdjs/ucd/commit/f32b2780f289cc058472bd964a6324fd94fa7c1f))
* refactor(ucd-store-v2): restructure analysis reporting interfaces ([49dc5596](https://github.com/ucdjs/ucd/commit/49dc5596f1f9fd07f8c145e09c44d91fc144deb8))
* refactor(ucd-store-v2): extend AnalyzeOptions with SharedOperationOptions ([84c4dc1e](https://github.com/ucdjs/ucd/commit/84c4dc1e0f297bd7f1ed1f3fd60a9049c99abcf2))
* refactor(ucd-store-v2): reorganize and enhance file operations tests ([3db7c109](https://github.com/ucdjs/ucd/commit/3db7c1092b890881bcf498b4c583f95aa82cfaab))

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
