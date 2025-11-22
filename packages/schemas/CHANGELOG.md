# @ucdjs/schemas

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.0...@ucdjs/schemas@0.2.0) (2025-11-22)


### Features
* introduce ucdRegistry for schema metadata management ([794d3cdb](https://github.com/ucdjs/ucd/commit/794d3cdb055edd1b8a75bec1eed71e0f536b130a)) (by [@luxass](https://github.com/luxass))
* add UCD configuration endpoint and schema ([5c8eaf7f](https://github.com/ucdjs/ucd/commit/5c8eaf7fd525bc8b102b9ac21c61a11d4be03de5)) (by [@luxass](https://github.com/luxass))
* add dependency on @ucdjs/schemas and update UnicodeTreeNode schema ([5bacfe2a](https://github.com/ucdjs/ucd/commit/5bacfe2aceeccb061a47cc02ba3ff10a5970e610)) (by [@luxass](https://github.com/luxass))
* add UnicodeTreeNode and UnicodeTree schemas ([b63b94b9](https://github.com/ucdjs/ucd/commit/b63b94b9796875e77a9aaff4513b3c116fc55565)) (by [@luxass](https://github.com/luxass))
* add UnicodeVersionSchema and refactor imports ([f1e3c5af](https://github.com/ucdjs/ucd/commit/f1e3c5afcc9bdefe3d1d38326157689f56c78f87)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6)) (by [@luxass](https://github.com/luxass))
* add schemas package with initial implementation ([58b02b89](https://github.com/ucdjs/ucd/commit/58b02b89baf7fd795ce0423ad9acda01726ca44b)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update FileEntrySchema registration method ([494a3205](https://github.com/ucdjs/ucd/commit/494a32050424a471e02e79968b32d1f8e473b612)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))

### Refactoring
* remove ucdRegistry and update schema registration ([381b5947](https://github.com/ucdjs/ucd/commit/381b59473f77c0f73f3b8184e07c2a8a9258b686)) (by [@luxass](https://github.com/luxass))
* update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)) (by [@luxass](https://github.com/luxass))
* update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)) (by [@luxass](https://github.com/luxass))
* update imports to use centralized schemas ([93cb36b4](https://github.com/ucdjs/ucd/commit/93cb36b42e463304b7aca4c4817bbe087ba7f843)) (by [@luxass](https://github.com/luxass))


## 0.1.0

### Minor Changes

- [#172](https://github.com/ucdjs/ucd/pull/172) [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8) Thanks [@luxass](https://github.com/luxass)! - feat: add initial schemas package

  This package provides schemas for different UCDJS components, including Api Responses, Environment Variables, and more.
