# @ucdjs/schema-gen

## [0.3.0](https://github.com/ucdjs/ucd/compare/@ucdjs/schema-gen@0.2.2...@ucdjs/schema-gen@0.3.0) (2025-11-16)

### Bug Fixes

* fix(cli, schema-gen): update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2))
* fix: throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346))

### Features

* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat: add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058))
* feat: enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a))

### Refactoring

* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* refactor(fields): use fileURLToPath for consistent path handling ([fb178d95](https://github.com/ucdjs/ucd/commit/fb178d95c6f888f0077114666ab6751ea5b741e0))


## 0.2.2

### Patch Changes

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0

## 0.2.1

### Patch Changes

- [#11](https://github.com/ucdjs/ucd/pull/11) [`78f4673`](https://github.com/ucdjs/ucd/commit/78f4673657a210eb374a025dabe7450291712a0a) Thanks [@luxass](https://github.com/luxass)! - feat: allow for providing ai model

## 0.2.0

### Minor Changes

- [`99eccc9`](https://github.com/ucdjs/ucd/commit/99eccc9bc76904e2e2b5c2233229857235841091) Thanks [@luxass](https://github.com/luxass)! - improve schemagen

## 0.1.0

### Minor Changes

- [#5](https://github.com/ucdjs/ucd/pull/5) [`d55695d`](https://github.com/ucdjs/ucd/commit/d55695d16b6ec74953e2f2314500d70590eb5d1a) Thanks [@luxass](https://github.com/luxass)! - feat: add schema-gen package
