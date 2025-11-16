# @ucdjs/schemas

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/schemas@0.1.0...@ucdjs/schemas@0.2.0) (2025-11-16)

### Features

* feat(schemas): introduce ucdRegistry for schema metadata management ([794d3cdb](https://github.com/ucdjs/ucd/commit/794d3cdb055edd1b8a75bec1eed71e0f536b130a))
* feat(api): add UCD configuration endpoint and schema ([5c8eaf7f](https://github.com/ucdjs/ucd/commit/5c8eaf7fd525bc8b102b9ac21c61a11d4be03de5))
* feat(fetch, schemas): add dependency on @ucdjs/schemas and update UnicodeTreeNode schema ([5bacfe2a](https://github.com/ucdjs/ucd/commit/5bacfe2aceeccb061a47cc02ba3ff10a5970e610))
* feat(schemas): add UnicodeTreeNode and UnicodeTree schemas ([b63b94b9](https://github.com/ucdjs/ucd/commit/b63b94b9796875e77a9aaff4513b3c116fc55565))
* feat(schemas): add UnicodeVersionSchema and refactor imports ([f1e3c5af](https://github.com/ucdjs/ucd/commit/f1e3c5afcc9bdefe3d1d38326157689f56c78f87))
* feat(ucd-store): update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689))
* feat(ucd-store): enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6))
* feat(schemas): add schemas package with initial implementation ([58b02b89](https://github.com/ucdjs/ucd/commit/58b02b89baf7fd795ce0423ad9acda01726ca44b))

### Bug Fixes

* fix(schemas): update FileEntrySchema registration method ([494a3205](https://github.com/ucdjs/ucd/commit/494a32050424a471e02e79968b32d1f8e473b612))
* fix(fs-bridge): enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* refactor(schemas): remove ucdRegistry and update schema registration ([381b5947](https://github.com/ucdjs/ucd/commit/381b59473f77c0f73f3b8184e07c2a8a9258b686))
* chore: add id ([8c907d94](https://github.com/ucdjs/ucd/commit/8c907d94b8cbf5ae00ce819b0cb5c2ca5ede74f0))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* refactor: update imports to use centralized schemas ([93cb36b4](https://github.com/ucdjs/ucd/commit/93cb36b42e463304b7aca4c4817bbe087ba7f843))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* chore: fix openapi docs ([08b8c4c3](https://github.com/ucdjs/ucd/commit/08b8c4c38554322b10db6cd23645def5004016d9))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore: update import statements for consistency ([c2e24246](https://github.com/ucdjs/ucd/commit/c2e24246c2814725a4a27a7bf78671f4b89e677f))
* chore(schemas): import FileEntrySchema and update its definition ([d4e1280e](https://github.com/ucdjs/ucd/commit/d4e1280ee603a6f7ccdc5c28cd19e488fc3d0849))
* chore: lint ([8d5c1d89](https://github.com/ucdjs/ucd/commit/8d5c1d8900cadb618f93f1cffe0dad8938c0f250))


## 0.1.0

### Minor Changes

- [#172](https://github.com/ucdjs/ucd/pull/172) [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8) Thanks [@luxass](https://github.com/luxass)! - feat: add initial schemas package

  This package provides schemas for different UCDJS components, including Api Responses, Environment Variables, and more.
