# @ucdjs/client

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/client@0.1.0...@ucdjs/client@0.2.0) (2025-11-20)


### Features
* add `isApiError` type guard and tests ([5b578e55](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d)) (by [@luxass](https://github.com/luxass))
* enhance UCD client initialization and error handling ([224c22ed](https://github.com/ucdjs/ucd/commit/224c22ed0fa2ad6483bb72f512965b9792fc7d1d)) (by [@luxass](https://github.com/luxass))
* add new ucd client ([d4ea6d9f](https://github.com/ucdjs/ucd/commit/d4ea6d9feb9dcd9cdb0394ab27323be980d2303c)) (by [@luxass](https://github.com/luxass))
* add discoverEndpointsFromConfig function and tests ([f196cb25](https://github.com/ucdjs/ucd/commit/f196cb2588ca0ab8b5115e63e4f115a84b51701c)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update return type for `get` method and remove generic type from `getManifest` ([31ba5a66](https://github.com/ucdjs/ucd/commit/31ba5a665b27877fc6d78f9d3934319b6ff5b782)) (by [@luxass](https://github.com/luxass))

### Refactoring
* improve error handling and response processing ([248a0dc4](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0)) (by [@luxass](https://github.com/luxass))
* refactor mock store handlers and remove unused types ([b6271135](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658)) (by [@luxass](https://github.com/luxass))
* streamline UCD client creation ([999ff6f1](https://github.com/ucdjs/ucd/commit/999ff6f132b89075bc90b9029bae5769c27a4626)) (by [@luxass](https://github.com/luxass))
* remove export of discoverEndpointsFromConfig ([97bf29fb](https://github.com/ucdjs/ucd/commit/97bf29fb873752067226b5dfa85dfbb7270f98b4)) (by [@luxass](https://github.com/luxass))
* update createVersionsResource to use unified endpoints configuration ([bdb1a39e](https://github.com/ucdjs/ucd/commit/bdb1a39e81c4443d89b6534ce8229b71de6bc25b)) (by [@luxass](https://github.com/luxass))
* replace hardcoded paths with endpoint references ([0c65da4b](https://github.com/ucdjs/ucd/commit/0c65da4bbb72e18d5a77c1f3c1ab338463417981)) (by [@luxass](https://github.com/luxass))
* refactor createFilesResource to use unified endpoints configuration ([899dffbb](https://github.com/ucdjs/ucd/commit/899dffbb90aaac939a4302d11ce4b9ff7882d1bc)) (by [@luxass](https://github.com/luxass))
* move ucd-config from client to shared ([d6094c9e](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c)) (by [@luxass](https://github.com/luxass))
* remove pre-configured client instance and update tests ([0d2a30fb](https://github.com/ucdjs/ucd/commit/0d2a30fb6de590c0997fe16dad0cbd9620c46fbd)) (by [@luxass](https://github.com/luxass))
* rename @ucdjs/fetch to @ucdjs/client ([396f59f1](https://github.com/ucdjs/ucd/commit/396f59f1554aff152f2f34848b670bc318f2e06a)) (by [@luxass](https://github.com/luxass))


## 0.1.0

### Minor Changes

- [#325](https://github.com/ucdjs/ucd/pull/325) [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868) Thanks [@luxass](https://github.com/luxass)! - Move `discoverEndpointsFromConfig` from `@ucdjs/client` to `@ucdjs-internal/shared`.

- [#81](https://github.com/ucdjs/ucd/pull/81) [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976) Thanks [@luxass](https://github.com/luxass)! - feat: add fetch client

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77) Thanks [@luxass](https://github.com/luxass)! - chore: remove path property of ApiError #141

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0
