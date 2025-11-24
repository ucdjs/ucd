# @ucdjs/schema-gen

## [0.2.2](https://github.com/ucdjs/ucd/compare/@ucdjs/schema-gen@0.2.2...@ucdjs/schema-gen@0.2.2) (2025-11-24)


### Features
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))
* enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))

### Refactoring
* update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)) (by [@luxass](https://github.com/luxass))
* update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)) (by [@luxass](https://github.com/luxass))
* use fileURLToPath for consistent path handling ([fb178d95](https://github.com/ucdjs/ucd/commit/fb178d95c6f888f0077114666ab6751ea5b741e0)) (by [@luxass](https://github.com/luxass))
## 0.2.1

### Patch Changes

- [#11](https://github.com/ucdjs/ucd/pull/11) [`78f4673`](https://github.com/ucdjs/ucd/commit/78f4673657a210eb374a025dabe7450291712a0a) Thanks [@luxass](https://github.com/luxass)! - feat: allow for providing ai model

## 0.2.0

### Minor Changes

- [`99eccc9`](https://github.com/ucdjs/ucd/commit/99eccc9bc76904e2e2b5c2233229857235841091) Thanks [@luxass](https://github.com/luxass)! - improve schemagen

## 0.1.0

### Minor Changes

- [#5](https://github.com/ucdjs/ucd/pull/5) [`d55695d`](https://github.com/ucdjs/ucd/commit/d55695d16b6ec74953e2f2314500d70590eb5d1a) Thanks [@luxass](https://github.com/luxass)! - feat: add schema-gen package
