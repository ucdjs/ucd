# @ucdjs/schema-gen

## [0.3.0](https://github.com/ucdjs/ucd/compare/@ucdjs/schema-gen@0.2.2...@ucdjs/schema-gen@0.3.0) (2025-11-16)

### Features

* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat: add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058))
* feat: enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a))

### Bug Fixes

* fix(cli, schema-gen): update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2))
* fix: throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* refactor(fields): use fileURLToPath for consistent path handling ([fb178d95](https://github.com/ucdjs/ucd/commit/fb178d95c6f888f0077114666ab6751ea5b741e0))
* chore(schema-gen): add dependency on @ucdjs/shared ([838a9ebe](https://github.com/ucdjs/ucd/commit/838a9ebe761bdf2b436351106cf22af624f7798f))
* chore: remove `p-limit` dependency across multiple packages ([a73147af](https://github.com/ucdjs/ucd/commit/a73147af43a01492e36e97b2403f565b5835dcd3))
* chore: fix imports ([162de26f](https://github.com/ucdjs/ucd/commit/162de26f4a95f541359e8e6cd5a997c597398e6f))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* chore(eslint): refactor ESLint configuration across multiple packages ([4924a4c8](https://github.com/ucdjs/ucd/commit/4924a4c8d1d1296fa6717b278e695d05450b2f5a))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore: fix typecheck ([cdc2888c](https://github.com/ucdjs/ucd/commit/cdc2888cf7bb2ecf87a925a3832afd5816c42e77))
* chore: update node engine version across packages ([315a422d](https://github.com/ucdjs/ucd/commit/315a422d589bf277cb99cd313a693baed973da75))
* chore: update dependencies ([a1d2a3a7](https://github.com/ucdjs/ucd/commit/a1d2a3a7638baf44d4b03062b0070ba7bf7e0222))
* chore: update package versions in pnpm-workspace.yaml ([9dde454c](https://github.com/ucdjs/ucd/commit/9dde454c84169dcb5a6fc5b82215602fc0a8c243))
* chore: add Codecov configuration and badges to documentation ([e18b6d02](https://github.com/ucdjs/ucd/commit/e18b6d02442f93afa055a0956ce5df69b70bba77))
* chore: refactor tsdown configuration across packages ([323318de](https://github.com/ucdjs/ucd/commit/323318def2095643c3062fb863c78f1942ac1516))
* chore: update pnpm workspace configuration ([e0f3343e](https://github.com/ucdjs/ucd/commit/e0f3343ea1cb513b00c4d8921c8135d2118a4b35))
* chore: migrate to use tooling packages ([5b7cf43a](https://github.com/ucdjs/ucd/commit/5b7cf43aff5bba0701cda7043106f83b94082c39))
* chore: update dependencies ([f262f3fc](https://github.com/ucdjs/ucd/commit/f262f3fc69d223097368fd8b69636225c4e983da))


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
