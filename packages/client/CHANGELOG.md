# @ucdjs/client

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/client@0.1.0...@ucdjs/client@0.2.0) (2025-11-16)

### Bug Fixes

* fix(ucd-store-v2): update return type for `get` method and remove generic type from `getManifest` ([31ba5a66](https://github.com/ucdjs/ucd/commit/31ba5a665b27877fc6d78f9d3934319b6ff5b782))

### Refactoring

* refactor(ucd-store-v2): improve error handling and response processing ([248a0dc4](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0))
* refactor(test-utils): refactor mock store handlers and remove unused types ([b6271135](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658))
* refactor(client): streamline UCD client creation ([999ff6f1](https://github.com/ucdjs/ucd/commit/999ff6f132b89075bc90b9029bae5769c27a4626))
* refactor(client): remove export of discoverEndpointsFromConfig ([97bf29fb](https://github.com/ucdjs/ucd/commit/97bf29fb873752067226b5dfa85dfbb7270f98b4))
* refactor(client): update createVersionsResource to use unified endpoints configuration ([bdb1a39e](https://github.com/ucdjs/ucd/commit/bdb1a39e81c4443d89b6534ce8229b71de6bc25b))
* refactor(client): replace hardcoded paths with endpoint references ([0c65da4b](https://github.com/ucdjs/ucd/commit/0c65da4bbb72e18d5a77c1f3c1ab338463417981))
* refactor(client): refactor createFilesResource to use unified endpoints configuration ([899dffbb](https://github.com/ucdjs/ucd/commit/899dffbb90aaac939a4302d11ce4b9ff7882d1bc))
* refactor(shared,client): move ucd-config from client to shared ([d6094c9e](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c))
* refactor(client): remove pre-configured client instance and update tests ([0d2a30fb](https://github.com/ucdjs/ucd/commit/0d2a30fb6de590c0997fe16dad0cbd9620c46fbd))
* refactor: rename @ucdjs/fetch to @ucdjs/client ([396f59f1](https://github.com/ucdjs/ucd/commit/396f59f1554aff152f2f34848b670bc318f2e06a))

### Features

* feat(shared): add `isApiError` type guard and tests ([5b578e55](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d))
* feat(ucd-store): enhance UCD client initialization and error handling ([224c22ed](https://github.com/ucdjs/ucd/commit/224c22ed0fa2ad6483bb72f512965b9792fc7d1d))
* feat: add new ucd client ([d4ea6d9f](https://github.com/ucdjs/ucd/commit/d4ea6d9feb9dcd9cdb0394ab27323be980d2303c))
* feat(client): add discoverEndpointsFromConfig function and tests ([f196cb25](https://github.com/ucdjs/ucd/commit/f196cb2588ca0ab8b5115e63e4f115a84b51701c))
