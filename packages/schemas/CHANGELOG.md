# @ucdjs/schemas

## [0.1.1-beta.6](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.1-beta.5...@ucdjs/schemas@0.1.1-beta.6) (2026-02-18)




### Notes

* No significant commits in this release.


## [0.1.1-beta.5](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.1-beta.4...@ucdjs/schemas@0.1.1-beta.5) (2026-02-16)




### Notes

* No significant commits in this release.


## [0.1.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.1-beta.3...@ucdjs/schemas@0.1.1-beta.4) (2026-02-15)




### Notes

* No significant commits in this release.


## [0.1.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.1-beta.2...@ucdjs/schemas@0.1.1-beta.2) (2026-02-15)


### 🚀 Features
* refactor manifest generation and upload process ([9a07f326](https://github.com/ucdjs/ucd/commit/9a07f326dc1f69fecc1615307f31d3f4cf5949f5)) (by [@luxass](https://github.com/luxass))
* add Lockfile and Snapshot schemas with tests ([09f0c156](https://github.com/ucdjs/ucd/commit/09f0c156761c0b27723d84d5fefd89b06e008c22)) (by [@luxass](https://github.com/luxass))
* export UCDStoreVersionManifest ([a66bd692](https://github.com/ucdjs/ucd/commit/a66bd692439e0cd98f5eeaed76de1a112bf73fec)) (by [@luxass](https://github.com/luxass))
* enhance lockfile schema and operations with filter support ([fda44914](https://github.com/ucdjs/ucd/commit/fda449148d9098c078944eaf290f4fce8b6095d5)) (by [@luxass](https://github.com/luxass))
* remove schema identifiers and add comprehensive tests for lockfile management ([62d66b94](https://github.com/ucdjs/ucd/commit/62d66b947fe5c8d41352c8c7c108eb60e7945d7c)) (by [@luxass](https://github.com/luxass))
* add lockfile and snapshot schemas with validation logic ([3622c51f](https://github.com/ucdjs/ucd/commit/3622c51f7854dbc14bb9239b1180ee7470aad521)) (by [@luxass](https://github.com/luxass))
* add per-version UCD store manifest endpoint and enhance config response ([ee76728d](https://github.com/ucdjs/ucd/commit/ee76728df3bb03191b1d099ff316f7ad7e8cd111)) (by [@luxass](https://github.com/luxass))
* add GET version details endpoint with detailed metadata and statistics ([145919dd](https://github.com/ucdjs/ucd/commit/145919dd35b69e429624fed9ba8e4a21a2d0dcaf)) (by [@luxass](https://github.com/luxass))
* introduce ucdRegistry for schema metadata management ([794d3cdb](https://github.com/ucdjs/ucd/commit/794d3cdb055edd1b8a75bec1eed71e0f536b130a)) (by [@luxass](https://github.com/luxass))
* add UCD configuration endpoint and schema ([5c8eaf7f](https://github.com/ucdjs/ucd/commit/5c8eaf7fd525bc8b102b9ac21c61a11d4be03de5)) (by [@luxass](https://github.com/luxass))
* add dependency on @ucdjs/schemas and update UnicodeTreeNode schema ([5bacfe2a](https://github.com/ucdjs/ucd/commit/5bacfe2aceeccb061a47cc02ba3ff10a5970e610)) (by [@luxass](https://github.com/luxass))
* add UnicodeTreeNode and UnicodeTree schemas ([b63b94b9](https://github.com/ucdjs/ucd/commit/b63b94b9796875e77a9aaff4513b3c116fc55565)) (by [@luxass](https://github.com/luxass))
* add UnicodeVersionSchema and refactor imports ([f1e3c5af](https://github.com/ucdjs/ucd/commit/f1e3c5afcc9bdefe3d1d38326157689f56c78f87)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6)) (by [@luxass](https://github.com/luxass))
* add schemas package with initial implementation ([58b02b89](https://github.com/ucdjs/ucd/commit/58b02b89baf7fd795ce0423ad9acda01726ca44b)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* correct typo in type annotation comment ([732b18eb](https://github.com/ucdjs/ucd/commit/732b18eb946d7c199e599120103f2816779181cf)) (by [@luxass](https://github.com/luxass))
* add type annotation for children getter ([72c6917c](https://github.com/ucdjs/ucd/commit/72c6917c322c9c097f6d8c8ffabb016384a444d4)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* enforce non-negative integer validation for file counts and sizes ([cfbfe937](https://github.com/ucdjs/ucd/commit/cfbfe93771cbef3098732b4a119452fbe344d484)) (by [@luxass](https://github.com/luxass))
* update FileEntrySchema registration method ([494a3205](https://github.com/ucdjs/ucd/commit/494a32050424a471e02e79968b32d1f8e473b612)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))
## [0.1.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.1-beta.0...@ucdjs/schemas@0.1.1-beta.1) (2026-02-15)


### 🚀 Features
* refactor manifest generation and upload process ([9a07f326](https://github.com/ucdjs/ucd/commit/9a07f326dc1f69fecc1615307f31d3f4cf5949f5)) (by [@luxass](https://github.com/luxass))
* add Lockfile and Snapshot schemas with tests ([09f0c156](https://github.com/ucdjs/ucd/commit/09f0c156761c0b27723d84d5fefd89b06e008c22)) (by [@luxass](https://github.com/luxass))
* export UCDStoreVersionManifest ([a66bd692](https://github.com/ucdjs/ucd/commit/a66bd692439e0cd98f5eeaed76de1a112bf73fec)) (by [@luxass](https://github.com/luxass))
* enhance lockfile schema and operations with filter support ([fda44914](https://github.com/ucdjs/ucd/commit/fda449148d9098c078944eaf290f4fce8b6095d5)) (by [@luxass](https://github.com/luxass))
* remove schema identifiers and add comprehensive tests for lockfile management ([62d66b94](https://github.com/ucdjs/ucd/commit/62d66b947fe5c8d41352c8c7c108eb60e7945d7c)) (by [@luxass](https://github.com/luxass))
* add lockfile and snapshot schemas with validation logic ([3622c51f](https://github.com/ucdjs/ucd/commit/3622c51f7854dbc14bb9239b1180ee7470aad521)) (by [@luxass](https://github.com/luxass))
* add per-version UCD store manifest endpoint and enhance config response ([ee76728d](https://github.com/ucdjs/ucd/commit/ee76728df3bb03191b1d099ff316f7ad7e8cd111)) (by [@luxass](https://github.com/luxass))
* add GET version details endpoint with detailed metadata and statistics ([145919dd](https://github.com/ucdjs/ucd/commit/145919dd35b69e429624fed9ba8e4a21a2d0dcaf)) (by [@luxass](https://github.com/luxass))
* introduce ucdRegistry for schema metadata management ([794d3cdb](https://github.com/ucdjs/ucd/commit/794d3cdb055edd1b8a75bec1eed71e0f536b130a)) (by [@luxass](https://github.com/luxass))
* add UCD configuration endpoint and schema ([5c8eaf7f](https://github.com/ucdjs/ucd/commit/5c8eaf7fd525bc8b102b9ac21c61a11d4be03de5)) (by [@luxass](https://github.com/luxass))
* add dependency on @ucdjs/schemas and update UnicodeTreeNode schema ([5bacfe2a](https://github.com/ucdjs/ucd/commit/5bacfe2aceeccb061a47cc02ba3ff10a5970e610)) (by [@luxass](https://github.com/luxass))
* add UnicodeTreeNode and UnicodeTree schemas ([b63b94b9](https://github.com/ucdjs/ucd/commit/b63b94b9796875e77a9aaff4513b3c116fc55565)) (by [@luxass](https://github.com/luxass))
* add UnicodeVersionSchema and refactor imports ([f1e3c5af](https://github.com/ucdjs/ucd/commit/f1e3c5afcc9bdefe3d1d38326157689f56c78f87)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6)) (by [@luxass](https://github.com/luxass))
* add schemas package with initial implementation ([58b02b89](https://github.com/ucdjs/ucd/commit/58b02b89baf7fd795ce0423ad9acda01726ca44b)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* correct typo in type annotation comment ([732b18eb](https://github.com/ucdjs/ucd/commit/732b18eb946d7c199e599120103f2816779181cf)) (by [@luxass](https://github.com/luxass))
* add type annotation for children getter ([72c6917c](https://github.com/ucdjs/ucd/commit/72c6917c322c9c097f6d8c8ffabb016384a444d4)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* enforce non-negative integer validation for file counts and sizes ([cfbfe937](https://github.com/ucdjs/ucd/commit/cfbfe93771cbef3098732b4a119452fbe344d484)) (by [@luxass](https://github.com/luxass))
* update FileEntrySchema registration method ([494a3205](https://github.com/ucdjs/ucd/commit/494a32050424a471e02e79968b32d1f8e473b612)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))


## [0.1.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.0...@ucdjs/schemas@0.1.1-beta.0) (2026-02-15)


### 🚀 Features
* refactor manifest generation and upload process ([9a07f326](https://github.com/ucdjs/ucd/commit/9a07f326dc1f69fecc1615307f31d3f4cf5949f5)) (by [@luxass](https://github.com/luxass))
* add Lockfile and Snapshot schemas with tests ([09f0c156](https://github.com/ucdjs/ucd/commit/09f0c156761c0b27723d84d5fefd89b06e008c22)) (by [@luxass](https://github.com/luxass))
* export UCDStoreVersionManifest ([a66bd692](https://github.com/ucdjs/ucd/commit/a66bd692439e0cd98f5eeaed76de1a112bf73fec)) (by [@luxass](https://github.com/luxass))
* enhance lockfile schema and operations with filter support ([fda44914](https://github.com/ucdjs/ucd/commit/fda449148d9098c078944eaf290f4fce8b6095d5)) (by [@luxass](https://github.com/luxass))
* remove schema identifiers and add comprehensive tests for lockfile management ([62d66b94](https://github.com/ucdjs/ucd/commit/62d66b947fe5c8d41352c8c7c108eb60e7945d7c)) (by [@luxass](https://github.com/luxass))
* add lockfile and snapshot schemas with validation logic ([3622c51f](https://github.com/ucdjs/ucd/commit/3622c51f7854dbc14bb9239b1180ee7470aad521)) (by [@luxass](https://github.com/luxass))
* add per-version UCD store manifest endpoint and enhance config response ([ee76728d](https://github.com/ucdjs/ucd/commit/ee76728df3bb03191b1d099ff316f7ad7e8cd111)) (by [@luxass](https://github.com/luxass))
* add GET version details endpoint with detailed metadata and statistics ([145919dd](https://github.com/ucdjs/ucd/commit/145919dd35b69e429624fed9ba8e4a21a2d0dcaf)) (by [@luxass](https://github.com/luxass))
* introduce ucdRegistry for schema metadata management ([794d3cdb](https://github.com/ucdjs/ucd/commit/794d3cdb055edd1b8a75bec1eed71e0f536b130a)) (by [@luxass](https://github.com/luxass))
* add UCD configuration endpoint and schema ([5c8eaf7f](https://github.com/ucdjs/ucd/commit/5c8eaf7fd525bc8b102b9ac21c61a11d4be03de5)) (by [@luxass](https://github.com/luxass))
* add dependency on @ucdjs/schemas and update UnicodeTreeNode schema ([5bacfe2a](https://github.com/ucdjs/ucd/commit/5bacfe2aceeccb061a47cc02ba3ff10a5970e610)) (by [@luxass](https://github.com/luxass))
* add UnicodeTreeNode and UnicodeTree schemas ([b63b94b9](https://github.com/ucdjs/ucd/commit/b63b94b9796875e77a9aaff4513b3c116fc55565)) (by [@luxass](https://github.com/luxass))
* add UnicodeVersionSchema and refactor imports ([f1e3c5af](https://github.com/ucdjs/ucd/commit/f1e3c5afcc9bdefe3d1d38326157689f56c78f87)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6)) (by [@luxass](https://github.com/luxass))
* add schemas package with initial implementation ([58b02b89](https://github.com/ucdjs/ucd/commit/58b02b89baf7fd795ce0423ad9acda01726ca44b)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* correct typo in type annotation comment ([732b18eb](https://github.com/ucdjs/ucd/commit/732b18eb946d7c199e599120103f2816779181cf)) (by [@luxass](https://github.com/luxass))
* add type annotation for children getter ([72c6917c](https://github.com/ucdjs/ucd/commit/72c6917c322c9c097f6d8c8ffabb016384a444d4)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* enforce non-negative integer validation for file counts and sizes ([cfbfe937](https://github.com/ucdjs/ucd/commit/cfbfe93771cbef3098732b4a119452fbe344d484)) (by [@luxass](https://github.com/luxass))
* update FileEntrySchema registration method ([494a3205](https://github.com/ucdjs/ucd/commit/494a32050424a471e02e79968b32d1f8e473b612)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))


## 0.1.0

### Minor Changes

- [#172](https://github.com/ucdjs/ucd/pull/172) [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8) Thanks [@luxass](https://github.com/luxass)! - feat: add initial schemas package

  This package provides schemas for different UCDJS components, including Api Responses, Environment Variables, and more.
