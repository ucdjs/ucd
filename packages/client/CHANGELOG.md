# @ucdjs/client v0.2.0
**Previous version**: `0.1.0`
**New version**: `0.2.0`


## ✨ Features
- **api**: refactor manifest generation and upload process (`9a07f326`)
- **client**: add protection again path traversal (`12110cef`)
- **client**: validate using zod schemas (`67669c9a`)
- **client**: enhance UCD client with config and manifest resources (`b4d8fbad`)
- **shared**: add `isApiError` type guard and tests (`5b578e55`)
- **ucd-store**: enhance UCD client initialization and error handling (`224c22ed`)
- add new ucd client (`d4ea6d9f`)
- **client**: add discoverEndpointsFromConfig function and tests (`f196cb25`)

## 🐛 Bug Fixes
- **api**: update manifest endpoint reference in files resource (`06e54ad4`)
- **ucd-store-v2**: update return type for `get` method and remove generic type from `getManifest` (`31ba5a66`)

## 📝 Documentation
- restructure client documentation and enhance installation instructions (`4ffb68f9`)

## ♻️ Refactoring
- reorganize pnpm catalogs for better scoping (##480) (`ba721776`)
- remove deprecated ucd-store.json endpoint (`9d94bacf`)
- **ucd-store-v2**: complete test structure refactor and enhance test coverage (`99163240`)
- **api**: remove deprecated well-known routes and update manifest endpoint (`1fe0d558`)
- **ucd-store-v2**: improve error handling and response processing (`248a0dc4`)
- **test-utils**: refactor mock store handlers and remove unused types (`b6271135`)
- **client**: streamline UCD client creation (`999ff6f1`)
- **client**: remove export of discoverEndpointsFromConfig (`97bf29fb`)
- **client**: update createVersionsResource to use unified endpoints configuration (`bdb1a39e`)
- **client**: replace hardcoded paths with endpoint references (`0c65da4b`)
- **client**: refactor createFilesResource to use unified endpoints configuration (`899dffbb`)
- **shared,client**: move ucd-config from client to shared (`d6094c9e`)
- **client**: remove pre-configured client instance and update tests (`0d2a30fb`)
- rename @ucdjs/fetch to @ucdjs/client (`396f59f1`)

## ✅ Tests
- **client**: update base URL handling in version tests (`dbb50a2c`)
- **client**: improve testing (`96d49dd3`)
- **client**: simplify invalid version format tests for manifest resource (`da5bf1d1`)
- **client**: update file and version resource tests to use destructured response (`30d6cba9`)
- **client**: update client tests to reflect new client changes (`91ad723c`)

## 🔧 Chores
- **workspace**: update dependencies and package manager (`1fcda2ca`)
- reorganize package catalogs and update dependencies (`ea2df11e`)
- update packageManager to pnpm@10.29.1 across all packages (`6bb966ab`)
- update dependencies and package manager (`e91a1ec4`)
- lint (`6b132401`)
- update dependencies (`59402701`)
- lint (`c4908b0a`)
- update pkg (`b4039996`)
- update dependencies (`51e6a071`)
- update typecheck command in package.json files (`34fa0ae7`)
- **turbo**: add $TURBO_EXTENDS$ dependency to tasks (`4d325efa`)
- perfom renames for unicode file tree (`3224787c`)
- upgrade pnpm (`b06a7dd7`)
- apply greptile suggestions (`e864d5b3`)
- update dependencies (`4b3590b9`)
- **client**: add path-utils dependencies (`61c2a948`)
- **deps**: update dependencies and package manager version (`8c5f051f`)
- **deps**: update package versions in `pnpm-workspace.yaml` (`2cca2fdf`)
- **deps**: update package versions in `pnpm-workspace.yaml` and package.json files (`34f3cab1`)
- **release**: 📦 version packages (`d592b87c`)
- update pnpm (`62648fcd`)
- update pnpm (`7e789f64`)
- correct package name references in configuration files (`824a6abd`)
- update jsdoc (`783ded85`)
- move guards file (`e5ee4084`)
- **client**: move guards file (`9f8d532c`)


