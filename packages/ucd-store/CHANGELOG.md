# @ucdjs/ucd-store

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/ucd-store@0.1.0...@ucdjs/ucd-store@0.2.0) (2025-11-16)

### Features

* feat(mock-store): add well-known handler for UCD configuration ([15212df0](https://github.com/ucdjs/ucd/commit/15212df0a3a0637671e8e5a53a4f606d9b031d33))
* feat(ucd-store): enhance UCD client initialization and error handling ([224c22ed](https://github.com/ucdjs/ucd/commit/224c22ed0fa2ad6483bb72f512965b9792fc7d1d))
* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(ucd-store): improve filter application in createPathFilter ([d3a11d5b](https://github.com/ucdjs/ucd/commit/d3a11d5b37ae13ad9c510f8b1ccf0fb6506a35ab))
* feat(ucd-store): enhance filtering options in getFileTree and getFilePaths ([c5335784](https://github.com/ucdjs/ucd/commit/c53357843da507204fd325f73af20a2df68780db))
* feat(ucd-store): add getFile method and update StoreInitOptions ([90f35232](https://github.com/ucdjs/ucd/commit/90f352323c725e49e18e9a9febd3649525742848))
* feat(ucd-store): add mirror functionality and types ([53937e0a](https://github.com/ucdjs/ucd/commit/53937e0a4041cef40bc96818cf89574c93616a7b))
* feat(ucd-store): add analysis functionality for UCD store ([e60ce1e6](https://github.com/ucdjs/ucd/commit/e60ce1e6dbfa9e9ce4cb80dd8700e6292bf6236f))
* feat(ucd-store): add cleaning functionality and types ([b944228c](https://github.com/ucdjs/ucd/commit/b944228cf1ef9e3ddf2c38cbbe01e50e89c1e024))
* feat(ucd-store): implement internal cleaning functionality ([ba6b79a0](https://github.com/ucdjs/ucd/commit/ba6b79a088e4efce257368d63a82f5eae5b7804b))
* feat(ucd-store): add clean functionality and enhance manifest handling ([1ac212ec](https://github.com/ucdjs/ucd/commit/1ac212ecfaef92565cd6a7d98070516c91f159ed))
* feat(ucd-store): optimize file and directory filtering in getFilePaths ([66558271](https://github.com/ucdjs/ucd/commit/665582718e8405a8d98dad77fd48c8be593653f5))
* feat(ucd-store): implement file tree filtering and structure ([f16729c6](https://github.com/ucdjs/ucd/commit/f16729c6080a6f010157ca305c93eb6f85d3fc94))
* feat(ucd-store): add getFile method for reading files with versioning and filtering ([109459c9](https://github.com/ucdjs/ucd/commit/109459c9fe31cf7a58ed173068b406922e9c89dc))
* feat(ucd-store): add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37))
* feat(ucd-store): add comprehensive tests for store initialization and version handling ([be470d64](https://github.com/ucdjs/ucd/commit/be470d64f8a3888751005204b34e73159c8741ce))
* feat(ucd-store): enhance store initialization and add mirroring functionality ([cb2c6db9](https://github.com/ucdjs/ucd/commit/cb2c6db98d303ea0bcab2cdc1caa90f2e88e2865))
* feat(ucd-store): add MirrorOptions and MirrorResult interfaces ([2ed53dc7](https://github.com/ucdjs/ucd/commit/2ed53dc7afeac5617788d2bdbc6e707bed684f72))
* feat(ucd-store): add support for versions in UCDStore constructor ([8aacb201](https://github.com/ucdjs/ucd/commit/8aacb20120de7eafbf232165d1a0bd59de83bcee))
* feat(ucd-store): enhance error handling in getExpectedFilePaths function ([1b2dc8db](https://github.com/ucdjs/ucd/commit/1b2dc8dbf4cf2ea4dc9928855f03d965f752ffae))
* feat(ucd-store): add getExpectedFilePaths function to retrieve file paths for Unicode versions ([c4eb5397](https://github.com/ucdjs/ucd/commit/c4eb53972670c860a13825ed1b2b371bac5dd074))
* feat(ucd-store): implement #analyzeVersion method for version analysis ([a626eacf](https://github.com/ucdjs/ucd/commit/a626eacf517f09ae5568bfb010aeb168a08365d1))
* feat(store): add analyze method for version analysis ([1cd85474](https://github.com/ucdjs/ucd/commit/1cd8547429725e0f659ca9892cb5904e519e1c56))
* feat(ucd-store): enhance initialization logging for debugging ([e84da432](https://github.com/ucdjs/ucd/commit/e84da432baba35893486864cdbe09778b722bc34))
* feat(ucd-store): update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689))
* feat(ucd-store): enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6))
* feat(ucd-store): update versions getter to return readonly array and fix import path for HTTP filesystem ([6fe7150e](https://github.com/ucdjs/ucd/commit/6fe7150e198b0793bb56e6245854458de03b5ff6))
* feat(fs-bridge): update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5))
* feat(fs-bridge): add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2))
* feat(ucd-store): add `versions` getter to expose immutable version set ([ae044aed](https://github.com/ucdjs/ucd/commit/ae044aed56476b9206c8a8c929517d8eeb9f72f1))
* feat(ucd-store): update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e))
* feat(ucd-store): add new playground scripts and logger utility ([b920e96a](https://github.com/ucdjs/ucd/commit/b920e96ad4a44fb1282d16f7ac82e1a64c1e5392))
* feat(ucd-store): implement UCDStore with filesystem capabilities ([71ec7472](https://github.com/ucdjs/ucd/commit/71ec74727921fad1a32374eb95e40280f85cff21))
* feat(errors): add UCDStoreUnsupportedFeature error class ([7342132a](https://github.com/ucdjs/ucd/commit/7342132aa776cf8bf7683039c129b46e11193320))
* feat(fs-bridge): update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74))
* feat(errors): add custom error classes for UCDStore ([574697b8](https://github.com/ucdjs/ucd/commit/574697b89e5fa78305a1b98579aebef99fa437a7))
* feat(fs-bridge): add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f))
* feat(ucd-store): add tests for mirrorUCDFiles and validateUCDFiles functions ([3214f78e](https://github.com/ucdjs/ucd/commit/3214f78eeb246cdf86799834e8993c0ca4f98d9e))
* feat(cli): add 'dev:api' script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154))
* feat(store): initialize UCDStore instances on creation ([dceca516](https://github.com/ucdjs/ucd/commit/dceca516a6aa80d391eebf696f118479ec525c44))
* feat: implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303))
* feat: add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058))
* feat: add filesystem abstraction to ucd-store ([c5a7c772](https://github.com/ucdjs/ucd/commit/c5a7c772d74a73a140246daac8034ab5d732783d))
* feat: implement options for disabling default excludes ([69bc180a](https://github.com/ucdjs/ucd/commit/69bc180a322659ad65078c66ea8422af163efb2e))
* feat: add preconfigured filters for path filtering functionality ([be0a7e1f](https://github.com/ucdjs/ucd/commit/be0a7e1f80a4fd14d2ef3667927cfaa56d657408))
* feat: add path filtering functionality to ucd-store ([5c878c4b](https://github.com/ucdjs/ucd/commit/5c878c4b35d29754e8411730cd9e8c6852dc73a5))
* feat: enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588))
* feat: switch to picomatch ([cbc1e497](https://github.com/ucdjs/ucd/commit/cbc1e497c1d738e8818c3ef140648190e62289f8))
* feat: implement repairStore function for validating and downloading missing files ([f3b06bba](https://github.com/ucdjs/ucd/commit/f3b06bba0a76630aed4b94b056f5040ab3f597c8))
* feat: add playground scripts for local and remote UCDStore ([72e2596a](https://github.com/ucdjs/ucd/commit/72e2596a2c0b31a906f0e690f4e947c6c5d166ea))
* feat: implement LocalUCDStore with version management and validation, remove metadata.ts ([cc7d84e3](https://github.com/ucdjs/ucd/commit/cc7d84e3383d600b82f1ae234eff9a031657d8b3))
* feat: replace fetchWithRetry with promiseRetry in RemoteUCDStore, update utils version to 2.3.0 ([1aa5b3f5](https://github.com/ucdjs/ucd/commit/1aa5b3f50bfd661144333a232e05309903797f16))
* feat: implement file handling methods in LocalUCDStore and RemoteUCDStore, update utils version ([9aa3e7a1](https://github.com/ucdjs/ucd/commit/9aa3e7a1638e8eb7914c2cc38605246057d2bb91))
* feat: add UCD version store validation ([6bfbe2d4](https://github.com/ucdjs/ucd/commit/6bfbe2d4ed85342f4940a84e017902532443c26c))
* feat: implement UCDStore with local and remote modes, add validation and metadata schemas ([af2be3e2](https://github.com/ucdjs/ucd/commit/af2be3e23dcc09a3b144e728724fba3dc43fdee8))
* feat: add ucd-store ([467cccda](https://github.com/ucdjs/ucd/commit/467cccdabe4a2d937f3479aa846ec96ac8961b80))

### Bug Fixes

* fix: update file paths to include 'extracted' prefix (#371) ([#371](https://github.com/ucdjs/ucd/issues/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243))
* fix: replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b))
* fix(ucd-store): remove unnecessary assertions ([28cff89f](https://github.com/ucdjs/ucd/commit/28cff89f28b63800c81e036bd014c9fd07706c93))
* fix(test-utils): update import paths for setupMockStore ([c667ffa7](https://github.com/ucdjs/ucd/commit/c667ffa7e5e893ddd89ca14232909c9764871539))
* fix(factory): update filter pattern assertion to use arrayContaining ([e49c74ba](https://github.com/ucdjs/ucd/commit/e49c74ba749183916dd43209aca5974482c4b7b9))
* fix(ucd-store): enhance error messages for filtered paths and API failures ([ee9840cb](https://github.com/ucdjs/ucd/commit/ee9840cb1fd50054cc4e6446047858486e502a04))
* fix(ucd-store): improve error handling for file not found ([6d7cd476](https://github.com/ucdjs/ucd/commit/6d7cd4765d5f4a4a348c44a88ef352f885ab130c))
* fix(ucd-store): improve error handling in getExpectedFilePaths ([2d8753bb](https://github.com/ucdjs/ucd/commit/2d8753bb6c3fbbca7e0cc74087d22aea8964d20a))
* fix(shared): ensure positive concurrency in clean, mirror, and repair functions ([6b8d705e](https://github.com/ucdjs/ucd/commit/6b8d705e1169c97c7ccde4a72a5cf0737d523171))
* fix(ucd-store): improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e))
* fix(ucd-store): improve error handling in internal__clean and update test assertions ([54e721ea](https://github.com/ucdjs/ucd/commit/54e721ea8f23350f3d751607227ddc8b0aefdbf6))
* fix(store): enhance version existence check and update tests ([46e55077](https://github.com/ucdjs/ucd/commit/46e550776f63f3392da93d9c1ed820ac61572917))
* fix(ucd-store): update success response for clean and mirror operations ([54b0c49b](https://github.com/ucdjs/ucd/commit/54b0c49b230812d0ede21fa15fa121e5e008a642))
* fix(ucd-store): improve error messages and handling in repair process ([a139798b](https://github.com/ucdjs/ucd/commit/a139798b7fee1331be361c3f4e7e0d7e8ef6f442))
* fix(ucd-store): improve file analysis logic for orphaned and missing files ([5519cd02](https://github.com/ucdjs/ucd/commit/5519cd025159a727e734cc0f7eaabe5dad827686))
* fix(ucd-store): enforce minimum concurrency requirement in cleaning process ([3b17ec09](https://github.com/ucdjs/ucd/commit/3b17ec095ceca6f3bdd6f5aa1ef3d6f705dbfbea))
* fix(ucd-store): ensure proper initialization checks in file operations ([7907bfcd](https://github.com/ucdjs/ucd/commit/7907bfcde7c1cdfcb8b8d616c8c21376014e27f3))
* fix(ucd-store): correct skipped files logic in internal__repair function ([ac2adb04](https://github.com/ucdjs/ucd/commit/ac2adb04b47502d1dabb91910fb679b5f98e7045))
* fix: make `baseUrl` optional in `MockStoreConfig` ([5c6849f2](https://github.com/ucdjs/ucd/commit/5c6849f27f7db362e5d91f5210dac60742209e66))
* fix(ucd-store): update orphaned files assertion to use toEqual for accuracy ([18d9cbdf](https://github.com/ucdjs/ucd/commit/18d9cbdfb0b337ac168e974f3e87622cf6baad3b))
* fix(ucd-store): update orphaned files assertion for accuracy ([5f2e96ba](https://github.com/ucdjs/ucd/commit/5f2e96ba908a9ae6b4f93535f7d83ec47c599411))
* fix(ucd-store): enhance file reading logic to handle absolute paths ([cd64bfa0](https://github.com/ucdjs/ucd/commit/cd64bfa08d09c66b34c84a188e769d2a293f686f))
* fix(ucd-store): improve error handling for file read operations ([af0f4e33](https://github.com/ucdjs/ucd/commit/af0f4e33f15aebc3d457a42e8ad400376d113e5b))
* fix(ucd-store): correct basePath assignment in createNodeUCDStore ([ba0c89ef](https://github.com/ucdjs/ucd/commit/ba0c89efe94cb10a0a54870915e37ef991b15800))
* fix(ucd-store): update error message for UCDStoreVersionNotFoundError ([90ca7004](https://github.com/ucdjs/ucd/commit/90ca70043a6a929ed6a960d33c45a727400b7e99))
* fix(ucd-store): improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf))
* fix(cli): adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9))
* fix(cli): correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04))
* fix(store): correct manifest data path resolution ([a12828a8](https://github.com/ucdjs/ucd/commit/a12828a8c87397b27f9f8f3af58fcd71ef0a32f1))
* fix(analyze): correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead))
* fix(ucd-store): set default basePath to './' in createNodeUCDStore ([b27073ee](https://github.com/ucdjs/ucd/commit/b27073eef4240de61fa59ecfda5294f342f1fca9))
* fix(ucd-store): remove unused error import in files.test.ts ([2dd1e822](https://github.com/ucdjs/ucd/commit/2dd1e822174c5480b4ad12e3bb861cbfa3cee275))
* fix(ucd-store): set default basePath to './' in createNodeUCDStore ([508e1bd0](https://github.com/ucdjs/ucd/commit/508e1bd03705d7ebdc445836ba15c817396fdcb4))
* fix(store): throw error for invalid JSON in store manifest ([08c95029](https://github.com/ucdjs/ucd/commit/08c950298eed92bec421918fc9b3224eaddb0e49))
* fix(ucd-store): update `.ucd-store.json` initialization to use an empty object ([8b5cf8d2](https://github.com/ucdjs/ucd/commit/8b5cf8d2ce9a22c2fd95c1a64839e512db5afc70))
* fix: throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346))
* fix(tests): update API URLs in test files ([9dff312a](https://github.com/ucdjs/ucd/commit/9dff312a4ef4cdfeb26e6a263dc399eb07e1eb7f))
* fix(store): update default URLs to use constants ([613e235f](https://github.com/ucdjs/ucd/commit/613e235fc1f616af75671f4de70889b6fa9094cc))
* fix: ensure fs-extra module is loaded correctly with error handling ([e14959e3](https://github.com/ucdjs/ucd/commit/e14959e31a0a485be7678fc76029a72c8d8f2c18))
* fix: use correct exports in index ([fd05e283](https://github.com/ucdjs/ucd/commit/fd05e283f45a5f15c8fbe92881a54c5716f287a8))
* fix: exclude ucd metadata errors in tests ([932c6ff5](https://github.com/ucdjs/ucd/commit/932c6ff5a2e201dc700e25ad620728c0f6034a4a))
* fix: use safe json parse in ucd metadata ([dff8260d](https://github.com/ucdjs/ucd/commit/dff8260df5077829a5591f2db13ae67d772ce476))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* refactor(tests): simplify mock responses for API versioning ([79c16c9b](https://github.com/ucdjs/ucd/commit/79c16c9b02baacb21e944d480daf33b7b1a1304f))
* chore: switch to @unicode-utils/* (#374) ([#374](https://github.com/ucdjs/ucd/issues/374)) ([735ae595](https://github.com/ucdjs/ucd/commit/735ae595c099d97724007583a4a8a66cd9d5a4f9))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* chore: fix tests ([4e338e73](https://github.com/ucdjs/ucd/commit/4e338e734657f5dad4a924ae8161f2ef058ab347))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* chore: fix typecheck ([d9dc3511](https://github.com/ucdjs/ucd/commit/d9dc35115d191cb421a9aa7f58e1138a935b5659))
* test(ucd-store): fix tests ([404e1e0f](https://github.com/ucdjs/ucd/commit/404e1e0fa25c495c6d049f1cefcf671f52ba94d7))
* refactor(fs-bridge): prefer for bridge capability change ([0a9500e4](https://github.com/ucdjs/ucd/commit/0a9500e4f2f98f89bd4ebfbfae377693c5eccc0c))
* chore: remove unused dependency ([2d2efa23](https://github.com/ucdjs/ucd/commit/2d2efa23b360b763159772895f2ca3f79a0c5389))
* chore: lint ([a2add47c](https://github.com/ucdjs/ucd/commit/a2add47c98964c809df666fb82ee3289103e4df0))
* test(ucd-store): remove unused `createMemoryMockFS` import ([1e88a3f1](https://github.com/ucdjs/ucd/commit/1e88a3f12f656c888ec8cfddaedf8cf6ca968c84))
* refactor(fs-bridge): remove `createMemoryMockFS` implementation ([cfb7e3ff](https://github.com/ucdjs/ucd/commit/cfb7e3ff801e1a5a8111f217d027dbf6fd4e80a0))
* refactor(fs-bridge): rename `metadata` to `meta` in bridge definitions ([1dd5e3f1](https://github.com/ucdjs/ucd/commit/1dd5e3f1d4d46290be8a051005fce145426feb22))
* refactor(fs-bridge): update bridge definitions to use metadata structure ([d52516d8](https://github.com/ucdjs/ucd/commit/d52516d86dbf45564eb4bffde7e2bbf5609d8ee6))
* test(fs-bridge): update bridge definition to use metadata structure ([07b5ac37](https://github.com/ucdjs/ucd/commit/07b5ac3784c75eb0e17e25e33a208134c35abb61))
* chore: fix rest of tests ([6a9a24fd](https://github.com/ucdjs/ucd/commit/6a9a24fd5bb97767ee558cfbd6e22c753a860aab))
* chore: lint ([7ff08975](https://github.com/ucdjs/ucd/commit/7ff089755cf3fad56019c40db45998522b4a0805))
* refactor(client): remove pre-configured client instance and update tests ([0d2a30fb](https://github.com/ucdjs/ucd/commit/0d2a30fb6de590c0997fe16dad0cbd9620c46fbd))
* refactor: rename @ucdjs/fetch to @ucdjs/client ([396f59f1](https://github.com/ucdjs/ucd/commit/396f59f1554aff152f2f34848b670bc318f2e06a))
* chore: lint ([ea61d4f7](https://github.com/ucdjs/ucd/commit/ea61d4f73234c7bec95501820a886a38b97d205b))
* chore(tests): update import paths for test utilities ([05725fc0](https://github.com/ucdjs/ucd/commit/05725fc0b3687ea717ee589fd71faf403e31727e))
* chore: fix typecheck ([9d75c455](https://github.com/ucdjs/ucd/commit/9d75c45568d7342bc56b159650c5f022680cb901))
* chore: typecheck ([d907ca5e](https://github.com/ucdjs/ucd/commit/d907ca5e0bebd359f621b49f99247c59406a1f29))
* refactor(test-utils): rename `setupMockStore` to `mockStoreApi` ([36bd17a2](https://github.com/ucdjs/ucd/commit/36bd17a29d2f15c3ab6c2ca0bf86e0bfee8ee7ea))
* chore: lint ([5fdacd01](https://github.com/ucdjs/ucd/commit/5fdacd01de9396ec8def259271a2beeab0392b86))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: fix ([29a3bd62](https://github.com/ucdjs/ucd/commit/29a3bd6253409c76721df269a1b877202e9cdf5d))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: fix imports ([883d0d3c](https://github.com/ucdjs/ucd/commit/883d0d3c4af4ced6edac4a7cdcebfcf2431719da))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* test(ucd-store): enhance file tree tests for nested filtering ([948bc45f](https://github.com/ucdjs/ucd/commit/948bc45f873b1e8e428419c536eeee0afeaba360))
* test(file-tree): add directory structure for filtered content ([00df2ba0](https://github.com/ucdjs/ucd/commit/00df2ba0e4ea94bd700c49ecc8c8aa0173dcb4a2))
* Merge branch 'main' into gitignore-style ([4b117e69](https://github.com/ucdjs/ucd/commit/4b117e694a992af5f482a760712d01fed295b552))
* chore: fix ([8193e709](https://github.com/ucdjs/ucd/commit/8193e7099025d91f2347e4534c9c7dbb7e576e8a))
* chore: add more debug ([bd2ce8a8](https://github.com/ucdjs/ucd/commit/bd2ce8a809d471f1c0a9db9f0da9696f83c2bb7c))
* chore: fix test ([c427656e](https://github.com/ucdjs/ucd/commit/c427656e52910937daedb4811743c4eaa0e6a947))
* chore: try fix test ([464a1768](https://github.com/ucdjs/ucd/commit/464a17683b37291942a2b44df44d9957493a0f08))
* Merge branch 'main' into gitignore-style ([9eecc067](https://github.com/ucdjs/ucd/commit/9eecc06729bf5e4d9da593fe63de240329142b6a))
* Merge branch 'main' into gitignore-style ([4ec79b18](https://github.com/ucdjs/ucd/commit/4ec79b186325baab182d20dd22fbad695b3d35f7))
* Merge remote-tracking branch 'origin/main' into bridge-try-catch ([c1682e3e](https://github.com/ucdjs/ucd/commit/c1682e3e2281d2baa131b47e6187e38b363e223a))
* chore: fix test ([a7c5f299](https://github.com/ucdjs/ucd/commit/a7c5f29917823f463fa01f1f5c2df2c699e94d38))
* chore: format ([f3dfcfa4](https://github.com/ucdjs/ucd/commit/f3dfcfa49814a0b5c49d3fa7ce0c3598996e5931))
* refactor(store): rename variable for clarity in getFileTree method ([33ea5000](https://github.com/ucdjs/ucd/commit/33ea5000dae783bd639be0aacff1a5ea9909d5e8))
* chore: fix test ([f1c8421b](https://github.com/ucdjs/ucd/commit/f1c8421b389edbc9fd9f1fa8b5880e42ac09b5a1))
* refactor(test): update test for disallowing file access outside the store ([3d121f98](https://github.com/ucdjs/ucd/commit/3d121f986a4f5ccfa03869f320e1d49ddc49a809))
* chore(tests): update import paths for error and factory tests ([631228bd](https://github.com/ucdjs/ucd/commit/631228bdf389589485e91f734f900b96dd07627c))
* chore: organise test files ([60114a7e](https://github.com/ucdjs/ucd/commit/60114a7ea6c85521a012c186733712827c12dc89))
* chore: organise test files ([73c31542](https://github.com/ucdjs/ucd/commit/73c31542671392610a85f59b205517281f1ade41))
* chore: organise test files ([275e1473](https://github.com/ucdjs/ucd/commit/275e14738edd19aaecc8f545bfd90b3637666a1a))
* chore: remove references to old UCDStoreError ([9361304e](https://github.com/ucdjs/ucd/commit/9361304e82654e4b12f0df36d1f9d13507f3f577))
* chore: fix test ([9f40185a](https://github.com/ucdjs/ucd/commit/9f40185a671645bf0c4f4c817adecc42b93d6eda))
* chore: fix duplciate return ([fa1254c4](https://github.com/ucdjs/ucd/commit/fa1254c46e1cfa3ed5afbc55d1d628dda65c149b))
* Merge branch 'main' into remove-error-details ([d38d081f](https://github.com/ucdjs/ucd/commit/d38d081f65f4536621d5793484fcc2f65557d43e))
* chore: fix tests ([f97d0f4d](https://github.com/ucdjs/ucd/commit/f97d0f4dd49ac81b1973ec3b92ddc195787625ed))
* refactor(ucd-store): rename UCDStoreError to UCDStoreGenericError ([a1eb9e5e](https://github.com/ucdjs/ucd/commit/a1eb9e5e189a69a551fc2d2bba3e35b5a65f64e8))
* chore: remove `p-limit` dependency across multiple packages ([a73147af](https://github.com/ucdjs/ucd/commit/a73147af43a01492e36e97b2403f565b5835dcd3))
* test(ucd-store): update mirror test to assert specific version results ([6985daa6](https://github.com/ucdjs/ucd/commit/6985daa6e0ec01b1a19cc3f06b427d2d0c7a0189))
* chore: lint ([55f8970d](https://github.com/ucdjs/ucd/commit/55f8970d17b358f6d73c541307bb9f9cb2724baf))
* refactor(ucd-store): update repair and file tree methods to return data and error ([45eae523](https://github.com/ucdjs/ucd/commit/45eae523f1c0bf70aec90fb0cb46426b8b3733ee))
* test(ucd-store): refactor mirror tests to use destructured results ([3f27b198](https://github.com/ucdjs/ucd/commit/3f27b1980a982acdfb158633d62d9dc592635884))
* chore: lint ([bd88b976](https://github.com/ucdjs/ucd/commit/bd88b9767f6a149ab2db844594a18d6b1729c128))
* test(ucd-store): update analyze method to return analyses and error ([6f2cd8b6](https://github.com/ucdjs/ucd/commit/6f2cd8b6486b4c9235c583752881f7b99f5c427e))
* refactor(store): improve error handling and return types ([3f2ad1f2](https://github.com/ucdjs/ucd/commit/3f2ad1f2de416a5e3e40d595e61d012f94f06bf8))
* Merge branch 'main' into store-result ([5a6ef8cc](https://github.com/ucdjs/ucd/commit/5a6ef8cc411c4431a9a1165b24ffa9c975b48fac))
* refactor: migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa))
* refactor(shared, utils): move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91))
* chore(ucd-store): update dependency from @ucdjs/utils to @ucdjs/shared ([945b46b2](https://github.com/ucdjs/ucd/commit/945b46b206ade9a713f7d99401a3b7a8d9c783f3))
* chore: dump commit ([a4a5f75e](https://github.com/ucdjs/ucd/commit/a4a5f75ed712f7c573693b2177f69d0247216b8a))
* chore: update test description ([a304eec1](https://github.com/ucdjs/ucd/commit/a304eec18b96abeaed1e85c27bc10a65bb35f69d))
* chore: fix message ([7d81f918](https://github.com/ucdjs/ucd/commit/7d81f9187b065bd8f20b2fecef3f7cc1c1ae770e))
* fix tests ([b1fc4890](https://github.com/ucdjs/ucd/commit/b1fc48900b239c2754388d2a8e276cfaed23b86d))
* test(ucd-store): add test for failure when concurrency is less than 1 ([92152393](https://github.com/ucdjs/ucd/commit/921523939b096f10c7d20a412da65f432eef060a))
* refactor(ucd-store): remove empty data fields from error responses ([2583f433](https://github.com/ucdjs/ucd/commit/2583f4332b7a9413ad3c6d10c62507c2c9d367d4))
* refactor(ucd-store): improve error handling for uninitialized store ([b5faa2e7](https://github.com/ucdjs/ucd/commit/b5faa2e72e242e0591fd2c8d0fd81e338e38a96e))
* refactor(ucd-store): streamline concurrency handling in internal__mirror function ([abde2c1d](https://github.com/ucdjs/ucd/commit/abde2c1deba2a984d54d6ad8c00eb9b91ba94d32))
* test(ucd-store): update assertions for mirrorResult.data to expect undefined ([24e8c87a](https://github.com/ucdjs/ucd/commit/24e8c87a53a38104708824c7f1dec0b8bcae9624))
* test(ucd-store): update assertions for mirrorResult.data to expect null ([c4422cf4](https://github.com/ucdjs/ucd/commit/c4422cf4b4b56a459654a775f264a867b6f5b43a))
* refactor(ucd-store): add note on response text decoding ([613cb0dd](https://github.com/ucdjs/ucd/commit/613cb0dd3a4435f3b0f8c196b04ff24a1220bc4f))
* refactor(ucd-store): streamline result handling in internal__mirror function ([900749d3](https://github.com/ucdjs/ucd/commit/900749d39d39d8414a7e5529534cf25a9235b387))
* refactor(ucd-store): enhance store analysis process ([ea85bb45](https://github.com/ucdjs/ucd/commit/ea85bb459c4565d3297e2df35a9b6db1f2e77d9f))
* refactor(ucd-store): enhance analyze method to return structured result ([26aa69b5](https://github.com/ucdjs/ucd/commit/26aa69b560b09bd4bf5cb7ababdd2f42c1f0b7be))
* refactor(ucd-store): update clean method to return structured result ([c052de9a](https://github.com/ucdjs/ucd/commit/c052de9a0c2fa4d002ad35688c2953cddfc38708))
* refactor(ucd-store): migrate repair to new result type ([7650ff8c](https://github.com/ucdjs/ucd/commit/7650ff8c4aa9f6b58fe6e1629b25d5488473a48b))
* refactor(ucd-store): improve error handling and response processing ([29624de9](https://github.com/ucdjs/ucd/commit/29624de96a06f1a46992c68de2569897b252daca))
* refactor(ucd-store): simplify error class hierarchy and improve type definitions ([3c50addd](https://github.com/ucdjs/ucd/commit/3c50addd3d3de45d56fd4e52970211cca49d2bd2))
* refactor(ucd-store): restructure error handling and introduce StoreError type ([53efb09a](https://github.com/ucdjs/ucd/commit/53efb09a962e83b8c8dbc66453ff1c775af8d619))
* refactor(ucd-store): rename StoreInitOptions to InitOptions ([b1a910f3](https://github.com/ucdjs/ucd/commit/b1a910f3f9668f472813fd1b421b5d26045bb5f0))
* chore: give better name for test ([de5397c5](https://github.com/ucdjs/ucd/commit/de5397c542a19c248c68b93945fbcf5bae59ce08))
* test(ucd-store): add dryRun test for store.clean method ([50144951](https://github.com/ucdjs/ucd/commit/501449518181de0323645af79a3b01878f25520a))
* chore: clean store clean ([2c46190b](https://github.com/ucdjs/ucd/commit/2c46190b6ea616b71962124d3de03afd899e9f2e))
* chore: fix ([32c272df](https://github.com/ucdjs/ucd/commit/32c272df2ed281c4b47dc18cf4331ec300aef71e))
* refactor: change store operations to be more stream lined ([a67bedd4](https://github.com/ucdjs/ucd/commit/a67bedd406d06d1d52e616aa42d79a627ed571fd))
* test: refactor mock file handling in analyze tests ([1228f6b8](https://github.com/ucdjs/ucd/commit/1228f6b8055949c243559e57800aa8e992f8008e))
* chore: fix type error ([dbd8bbf1](https://github.com/ucdjs/ucd/commit/dbd8bbf1e225975423811d8e8098972eb53670c5))
* test: replace `mockFetch` with `setupMockStore` for API responses ([53b4ece5](https://github.com/ucdjs/ucd/commit/53b4ece56aa79d7486a88c6f1b6ea3dc5c162929))
* test: update mockFetch calls to remove redundant HEAD requests ([61b4a3f9](https://github.com/ucdjs/ucd/commit/61b4a3f9e9cdfb36d9e789e0a1ff6d2270e6ac04))
* chore: replace mockFetch with setupMockStore for API responses ([ced7b951](https://github.com/ucdjs/ucd/commit/ced7b95166617a241d758055ec502bae2a639717))
* chore: migrate test-utils-internal to internal alias ([2cd82c0d](https://github.com/ucdjs/ucd/commit/2cd82c0d2c052572349a85946aca560b7bb8b212))
* chore: fix imports ([162de26f](https://github.com/ucdjs/ucd/commit/162de26f4a95f541359e8e6cd5a997c597398e6f))
* chore: update pnpm workspace and add test utils package ([80e2d592](https://github.com/ucdjs/ucd/commit/80e2d5920f851ea557ab45fdfa31c6a7d9d095ac))
* chore: refactor imports to use #test-utils for consistency ([280d8ea9](https://github.com/ucdjs/ucd/commit/280d8ea965d959addf41a43d20fe3918189326cd))
* chore(ucd-store): improve file analysis logic and update documentation ([c0ca788b](https://github.com/ucdjs/ucd/commit/c0ca788bd15786cd50eb26119381c76eb72c0717))
* chore: clean up imports in node and store modules ([8b4e6ffe](https://github.com/ucdjs/ucd/commit/8b4e6ffe3f1609b5632460dd3c6d2b0211b7cf8f))
* chore: update file paths in tests and implementation ([217e3add](https://github.com/ucdjs/ucd/commit/217e3addfcc0a5a6351091ea67fbe895a06212fb))
* chore: update file paths in tests and manifest ([83fa2eff](https://github.com/ucdjs/ucd/commit/83fa2efff14c5152b62a18961c303ac753f5696f))
* chore: rename files ([d45b77c1](https://github.com/ucdjs/ucd/commit/d45b77c1eaf200c79d6932a4ccde34fe9df4c548))
* test(ucd-store): add tests for store cleaning functionality ([7ef66c3c](https://github.com/ucdjs/ucd/commit/7ef66c3c22c3bdde698200e4a913246bde2993e0))
* test(ucd-store): add tests for file retrieval functionality ([8336f074](https://github.com/ucdjs/ucd/commit/8336f074b20991b9208a3bd7879acb6adb4f1299))
* test(ucd-store): add capability requirements tests for file system bridge ([0be17894](https://github.com/ucdjs/ucd/commit/0be17894321e6afd7a6123ee8795767aff50dae5))
* test(ucd-store): add comprehensive tests for file tree filtering ([2104c6c5](https://github.com/ucdjs/ucd/commit/2104c6c5e94acb1b7323e69318dec383ab3a4d02))
* chore(ucd-store): enhance Node Playground with file operations and directory management ([337b64ce](https://github.com/ucdjs/ucd/commit/337b64ce386cb62ee1af33f2412fdcbc46ef714a))
* chore(ucd-store): update ESLint ignores to include all playground files ([03ce88d1](https://github.com/ucdjs/ucd/commit/03ce88d1566faf87fdc13d31b326f6cff5ec4a5d))
* refactor(ucd-store): simplify store creation functions and update return types ([253cba2c](https://github.com/ucdjs/ucd/commit/253cba2c4d6d8dd402ab978e6ce1e8919605bac3))
* chore: install p-limit ([47494409](https://github.com/ucdjs/ucd/commit/4749440908ffccc0918976f18661a8169e917881))
* refactor(ucd-store): rename `initialize` to `init` and update usage ([474b5c57](https://github.com/ucdjs/ucd/commit/474b5c57bbb800908313e4b9c6b099a79eb1fd64))
* chore: fix ([7b5c4795](https://github.com/ucdjs/ucd/commit/7b5c4795edf5817c3272784d0f700d18a9b85fb0))
* chore: lint ([35b5f9ef](https://github.com/ucdjs/ucd/commit/35b5f9efcd85615edcf991fab49cca8dd0d2318b))
* refactor(ucd-store): remove StoreCapabilities and related logic ([1a6e079f](https://github.com/ucdjs/ucd/commit/1a6e079fc569891aacd336786e9507b9ffa335fc))
* chore: fix tests ([ac1da480](https://github.com/ucdjs/ucd/commit/ac1da480a3beb21ee2483820a9fe7c2833115eb2))
* chore: remove store capabilities ([fc7f950d](https://github.com/ucdjs/ucd/commit/fc7f950dfb740a03dfe2e5d4297919c6be818e3f))
* chore: fix types ([9d723057](https://github.com/ucdjs/ucd/commit/9d7230577f227c17ae30943d2f66548aa3ee801b))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* chore: remove stat reference ([69152dac](https://github.com/ucdjs/ucd/commit/69152dac1b30b552c522196b185a8d2d64f1d0cc))
* test(ucd-store): enhance capability requirements and add assertions ([3910babf](https://github.com/ucdjs/ucd/commit/3910babfa9117989021bad2b364b00a1130f187b))
* chore: fix duplicate capability requirement ([4871f509](https://github.com/ucdjs/ucd/commit/4871f50979cf5882dd3bcd32059791b59c2f76b4))
* chore: fix test ([7c7e3a55](https://github.com/ucdjs/ucd/commit/7c7e3a551f02ce6b291da3cf97bdfefe567ca886))
* refactor(ucd-store): update FileSystemBridge integration and capabilities handling ([c2f7e5d3](https://github.com/ucdjs/ucd/commit/c2f7e5d3d05170bd6a83697572b2f454a6d86dcb))
* chore: fix typo ([5f7ad538](https://github.com/ucdjs/ucd/commit/5f7ad5389c0806e895936fd377110ad9972563db))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* test: remove unused import from `files.test.ts` ([defc116f](https://github.com/ucdjs/ucd/commit/defc116f57b09ad6147314305a7be9f39f302e34))
* chore(eslint): update `@luxass/eslint-config` to version 5.2.1 ([28c3338f](https://github.com/ucdjs/ucd/commit/28c3338fbe59474a2dca4f65e21598a5fece83e2))
* test(ucd-store): integrate `memfs` for enhanced filesystem operations ([1b539ab2](https://github.com/ucdjs/ucd/commit/1b539ab2b8c4511c446ed41114b850f5350358e7))
* test: update custom store analyze operations and improve assertions ([190846ef](https://github.com/ucdjs/ucd/commit/190846efa5c2c06220d25238131056b3f824503a))
* refactor(store): improve file path handling and analysis logic ([3d586c5b](https://github.com/ucdjs/ucd/commit/3d586c5b14d8f0e49c4fc107a0a4fb4f674ba239))
* Merge branch 'main' into store-analyze ([ea3b7f74](https://github.com/ucdjs/ucd/commit/ea3b7f7451e1d658d3adbcb8e01983111a37cfa9))
* chore(eslint): update ignore path for playgrounds ([0e46f893](https://github.com/ucdjs/ucd/commit/0e46f893b6eeacbd3d65cdbe6d1142ff48b53a4f))
* chore(eslint): refactor ESLint configuration across multiple packages ([4924a4c8](https://github.com/ucdjs/ucd/commit/4924a4c8d1d1296fa6717b278e695d05450b2f5a))
* chore(eslint): add no-restricted-imports rule to ESLint configuration ([f67b03f2](https://github.com/ucdjs/ucd/commit/f67b03f229211c0ff5aa2668dc04664e2702d663))
* chore: add experimental decorators to compiler options ([cf810bbc](https://github.com/ucdjs/ucd/commit/cf810bbc1eeda911468b7d1fa2f326dc8a00a8e5))
* chore: add experimental decorators to compiler options ([651babe3](https://github.com/ucdjs/ucd/commit/651babe3c71fad6352353744ecc8acf7b5906992))
* chore: dump old test file ([3bd4c5fc](https://github.com/ucdjs/ucd/commit/3bd4c5fc2046eb6b364d3e2c34e18dcf72045697))
* refactor(ucd-store): reorganize error exports for clarity ([b292d738](https://github.com/ucdjs/ucd/commit/b292d73863023bc2be684186d8526ed751534882))
* refactor(ucd-store): reorganize error exports for clarity ([4d5cfb2a](https://github.com/ucdjs/ucd/commit/4d5cfb2a024dc612418e99c5eedd2b1ad27e5e57))
* chore: lint ([84f41b15](https://github.com/ucdjs/ucd/commit/84f41b150b58bc90733aa54c697425f7d312907c))
* chore: lint ([149bcbe4](https://github.com/ucdjs/ucd/commit/149bcbe413fb9bde466e19796aad66abf2044eb7))
* test(ucd-store): update tests to use DEFAULT_VERSIONS for store initialization ([7bf842f8](https://github.com/ucdjs/ucd/commit/7bf842f8a21592e1ee0eedf80cfca67dcba1cab3))
* chore(store): remove debug logging from initialize method ([79393b2a](https://github.com/ucdjs/ucd/commit/79393b2a7d1469c006ddf573b31bde36cbe10198))
* chore: remove only ([74a7ec6a](https://github.com/ucdjs/ucd/commit/74a7ec6a47c185d2178f7d364ebf98435957c968))
* test(ucd-store): enhance HTTP store tests with default versions ([b76bc30a](https://github.com/ucdjs/ucd/commit/b76bc30a5282978ce75d464c268103feb03f86d1))
* chore(ucd-store): remove debug logging for filesystem operations ([4ee6502d](https://github.com/ucdjs/ucd/commit/4ee6502d3ad9d3df31a5e1a04ca38195b01007fd))
* test(ucd-store): add comprehensive tests for UCD store configurations ([213439cb](https://github.com/ucdjs/ucd/commit/213439cbac875adc7177a24567f8ff53e35a4450))
* chore: add dependency on `@ucdjs/fs-bridge` ([e4a3e3db](https://github.com/ucdjs/ucd/commit/e4a3e3dbc1f24878455367ce7b375bc0c03e327b))
* Merge branch 'main' into store ([51202351](https://github.com/ucdjs/ucd/commit/512023512095a063931e84ac55a9d12149fd173a))
* chore: add `pathe` package to project ([851b07ae](https://github.com/ucdjs/ucd/commit/851b07ae539f02d2a647cf590b04fdf256b8d230))
* chore(ucd-store): add read-only and memory mock file system implementations for testing ([197dc56c](https://github.com/ucdjs/ucd/commit/197dc56c2f3b857aa25faf54fd7a7207a7e8e566))
* chore: typecheck playgrounds ([b2f3ac92](https://github.com/ucdjs/ucd/commit/b2f3ac92ff0d85a313166c7c8c00e554c50b0492))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore: lint ([efab6b03](https://github.com/ucdjs/ucd/commit/efab6b03655eb5d58d88ee47ecf546162895df30))
* chore: remove ucd store functionality, will add back in #132 ([#132](https://github.com/ucdjs/ucd/issues/132)) ([05d01354](https://github.com/ucdjs/ucd/commit/05d01354f78a33124f558478d71f71a0a882382d))
* refactor(ucd-files): remove unused export of flattenFilePaths ([1e3b78e0](https://github.com/ucdjs/ucd/commit/1e3b78e03d8e07879e7813eb9497ee7cca287c0d))
* refactor(store): update file tree types and import flattenFilePaths from utils ([c3cb6344](https://github.com/ucdjs/ucd/commit/c3cb6344d227a8c49883f942ba668c09a0677e7d))
* refactor: rename FileTreeNode to UnicodeTreeNode and update related schemas ([7f366e53](https://github.com/ucdjs/ucd/commit/7f366e531644413e4701a4ceab7f7b579eecade4))
* Remove obsolete tests for UCD file handling and replace with a simple truthy check ([cd1e03a3](https://github.com/ucdjs/ucd/commit/cd1e03a3df4a9a7fc3089d63b55d7a6dc89184c1))
* chore: fix ([32bc6720](https://github.com/ucdjs/ucd/commit/32bc67200f86ecac5d34f86ea154703f15a35d43))
* chore: fix until new store ([ccc1761d](https://github.com/ucdjs/ucd/commit/ccc1761de6364f04e2d9f8eed45495be4e95f57c))
* chore: update msw utils ([1b01b219](https://github.com/ucdjs/ucd/commit/1b01b2199e77cce324c08e62b80faf90fd2c7b90))
* chore: update node engine version across packages ([315a422d](https://github.com/ucdjs/ucd/commit/315a422d589bf277cb99cd313a693baed973da75))
* chore: update dependencies ([a1d2a3a7](https://github.com/ucdjs/ucd/commit/a1d2a3a7638baf44d4b03062b0070ba7bf7e0222))
* chore: update package versions in pnpm-workspace.yaml ([9dde454c](https://github.com/ucdjs/ucd/commit/9dde454c84169dcb5a6fc5b82215602fc0a8c243))
* chore: add Codecov configuration and badges to documentation ([e18b6d02](https://github.com/ucdjs/ucd/commit/e18b6d02442f93afa055a0956ce5df69b70bba77))
* chore: refactor tsdown configuration across packages ([323318de](https://github.com/ucdjs/ucd/commit/323318def2095643c3062fb863c78f1942ac1516))
* Update store.test.ts ([c290557f](https://github.com/ucdjs/ucd/commit/c290557f6c2c4f824828efbb1cde6548e71d2905))
* chore: fix dependency ([568ffe9f](https://github.com/ucdjs/ucd/commit/568ffe9fccc83ab1a04ae56f6ce892ad8507d8bd))
* chore: lint ([05dd91ff](https://github.com/ucdjs/ucd/commit/05dd91ffb439f628fefdac91ba600c5ad8e51cd2))
* chore: update Unicode API references and dependencies ([17ee2ee9](https://github.com/ucdjs/ucd/commit/17ee2ee9d47ad56c1d05bd7e7cb0250bf53719f9))
* chore: use fetch client in store ([42cac845](https://github.com/ucdjs/ucd/commit/42cac845aa1b519e8a5e803e9c6d23daa68e7c9a))
* chore: fix tests ([bbf12bba](https://github.com/ucdjs/ucd/commit/bbf12bba50b8f886054d6e22e2e7510e1f4946d4))
* Merge remote-tracking branch 'origin/main' into improve-store ([be872aa4](https://github.com/ucdjs/ucd/commit/be872aa40a651eb5b2fabfd615e250b07b5a0ffc))
* chore: update pnpm workspace configuration ([e0f3343e](https://github.com/ucdjs/ucd/commit/e0f3343ea1cb513b00c4d8921c8135d2118a4b35))
* refactor(store): update default base URL for remote store ([add5c0a7](https://github.com/ucdjs/ucd/commit/add5c0a7badfbe2e13d0a8bf20c02782ed0462fe))
* refactor(store): streamline store initialization and manifest handling ([de5eb013](https://github.com/ucdjs/ucd/commit/de5eb013c1c4d1f9634ef81c934dd538b267c73f))
* refactor(store): simplify filter application in UCDStore ([dc8fbc7d](https://github.com/ucdjs/ucd/commit/dc8fbc7dcb008545e50c74a6ad82cdc0d4994374))
* refactor(utils): update `PathFilter` methods for improved filter management ([64e60659](https://github.com/ucdjs/ucd/commit/64e606598e497f67d8fd059e076a88f7fe406c15))
* refactor(store): simplify filter handling in file processing ([a6eee96a](https://github.com/ucdjs/ucd/commit/a6eee96aefa2600c9cd2eca3f5caada9748e1343))
* chore(utils): remove `fs-extra` dependency and update documentation ([a824e6f7](https://github.com/ucdjs/ucd/commit/a824e6f7f1fbff865d9637426d85aae9528fdbf8))
* refactor(store): update filter type and enhance file retrieval methods ([cf7f7b1d](https://github.com/ucdjs/ucd/commit/cf7f7b1d185a56c0e59f78bbac412d2305ba7439))
* refactor(store): replace `createUCDStore` with specific local and remote store creation functions ([4c824601](https://github.com/ucdjs/ucd/commit/4c824601f7bde6d24ad0afb5290023d39fd7227d))
* refactor(store): replace hardcoded URLs with constants and improve store initialization ([3ea42a18](https://github.com/ucdjs/ucd/commit/3ea42a18899b4820df7672c0e37b8387e90fcf20))
* chore: lint ([f2eafef5](https://github.com/ucdjs/ucd/commit/f2eafef524c9352a7425c20cdc694f4d45c8a399))
* refactor(store): unify UCDStore implementation and remove legacy classes ([5a9bea8d](https://github.com/ucdjs/ucd/commit/5a9bea8df2883ee00e5c6d79d44532b857737208))
* refactor: remove local and remote UCD store implementations ([29f0f599](https://github.com/ucdjs/ucd/commit/29f0f599b53782a13ce97445135a738fa7f1901d))
* chore: fix imports ([259055e2](https://github.com/ucdjs/ucd/commit/259055e215974854990b70ffb74453c35682c627))
* chore: fix typecheck ([8271f248](https://github.com/ucdjs/ucd/commit/8271f248de7d010e208bd0cbdbb2a4822133e161))
* chore: fix tests ([0d6bf5ed](https://github.com/ucdjs/ucd/commit/0d6bf5edf2974748e68bd02d5fe8f2892912252f))
* chore: remove downloads cmd I will create a new PR which adds a new CLI for stores, that will be the new cli to use ([811b2772](https://github.com/ucdjs/ucd/commit/811b277208cda9d76974606a7694212fa663e89c))
* chore: fix errors ([54255f01](https://github.com/ucdjs/ucd/commit/54255f01f63c14727875f3d72b6b11a20a1f640e))
* refactor: remove deprecated FsInterface tests and related code; implement repairUCDFiles functionality with improved error handling and file downloading logic ([9d37fafe](https://github.com/ucdjs/ucd/commit/9d37fafe0ba0d4fef419d1b43717634d58191166))
* refactor: remove FsInterface and related functions; update download logic to use buildUCDPath ([d3ee25dc](https://github.com/ucdjs/ucd/commit/d3ee25dc3c9dc22242f1ed4485047f3bc0cd7eba))
* refactor: replace internal flattenFilePaths method with utility function ([eca5fc39](https://github.com/ucdjs/ucd/commit/eca5fc3955add4c966f70f44741512356dc10d30))
* refactor: update imports to use utils package for PRECONFIGURED_FILTERS ([5ac735ab](https://github.com/ucdjs/ucd/commit/5ac735ab53f701b664575d2762442a4f19b35c46))
* refactor: move filter functionality from ucd-store to utils package ([98b84b07](https://github.com/ucdjs/ucd/commit/98b84b07af8c09a3b8881af95a5fdf99d4afb52e))
* chore: migrate to use tooling packages ([5b7cf43a](https://github.com/ucdjs/ucd/commit/5b7cf43aff5bba0701cda7043106f83b94082c39))
* chore: fix tests ([71d5ceed](https://github.com/ucdjs/ucd/commit/71d5ceede8c54571543632250c2f0f8ed5635da6))
* refactor: move UnicodeVersionFile type to unicode-utils-new/fetch ([69858bf6](https://github.com/ucdjs/ucd/commit/69858bf68adf7ca0b7c4ee5d3f2a75c03946af20))
* refactor: remove unused buildProxyUrl function and update fetch call to use URL constructor ([d8ced9be](https://github.com/ucdjs/ucd/commit/d8ced9bec1a5937ef07d243caec23b5a19ff0300))
* refactor: update filter patterns to use consistent naming for exclusion filters ([6b25c005](https://github.com/ucdjs/ucd/commit/6b25c00550812568759a370fc4c59c95daf5720d))
* fix tests ([aefc815e](https://github.com/ucdjs/ucd/commit/aefc815e314e7258e0a6393bf7e398e56e4d74f3))
* chore: lint ([e521de17](https://github.com/ucdjs/ucd/commit/e521de1716e5add3f281e42e40474bb9ab94f050))
* refactor: remove filterPatterns from UCDStore interfaces and update related classes ([a94430ce](https://github.com/ucdjs/ucd/commit/a94430cebf4dd1648eae499fdf5812292f18d81f))
* refactor: remove unused file filtering options ([73cc0133](https://github.com/ucdjs/ucd/commit/73cc0133cb7b0eac8f22fdd23bcc3a099925764c))
* refactor: change fs-interface ([72e6ae96](https://github.com/ucdjs/ucd/commit/72e6ae96604baeb64cbc4186442b332749be135e))
* refactor: simplify PRECONFIGURED_FILTERS from arrays to strings ([b68336b4](https://github.com/ucdjs/ucd/commit/b68336b438987f1d81e5dc7aa8b5768e8d6e77af))
* chore: lint ([aa8dae53](https://github.com/ucdjs/ucd/commit/aa8dae53c47f5abcaccadc5facc793acd5391993))
* refactor: replace picomatch with createPathFilter for improved path filtering in RemoteUCDStore ([a74bc542](https://github.com/ucdjs/ucd/commit/a74bc542a2d68685bcdefec4d598e076a51bc43e))
* refactor: rename filters to filterPatterns for consistency across UCDStore interfaces and implementations ([7da35681](https://github.com/ucdjs/ucd/commit/7da35681595e776d6d6f8106a511711b387916d6))
* chore: lint ([46db123a](https://github.com/ucdjs/ucd/commit/46db123a055fe7d3ca1539df6b00aaccd604b207))
* test: add unit tests for fsInterface and fsExtraImplementation ([12603ff1](https://github.com/ucdjs/ucd/commit/12603ff1f83eecbe133a726575cc42b4020eff5b))
* refactor: replace mkdirp with mkdir with recursive option in repairLocalStore ([a8f7190a](https://github.com/ucdjs/ucd/commit/a8f7190a6092a07721ad8689b24735655fef1b0d))
* chore: update dependencies ([f262f3fc](https://github.com/ucdjs/ucd/commit/f262f3fc69d223097368fd8b69636225c4e983da))
* refactor: simplify imports in local.ts by removing unused types ([9e9bb735](https://github.com/ucdjs/ucd/commit/9e9bb735aece80cb995ac16a718a7342266f5527))
* refactor: update LocalUCDStore to improve initialization and validation logic ([12a6caf8](https://github.com/ucdjs/ucd/commit/12a6caf835299d2accbbee7fd4eebbd89ddd8067))
* chore: fix gitignore ([5989302d](https://github.com/ucdjs/ucd/commit/5989302d6e1e2ec9d7d3aedc16afd308faac638e))
* refactor: update file cache access to private class field and improve URL construction ([4ed626dd](https://github.com/ucdjs/ucd/commit/4ed626dd11b388259ef2c759af5e43fdddc68c85))
* test: add comprehensive tests for RemoteUCDStore functionality ([6375bb72](https://github.com/ucdjs/ucd/commit/6375bb720c3aef5479d62a22f5512ae7b10aa9a3))
* chore: export UCDStore ([9cf14075](https://github.com/ucdjs/ucd/commit/9cf14075ff3a608af632cc2c8a3ff67b65d626ba))
* chore: lint ([19f956cf](https://github.com/ucdjs/ucd/commit/19f956cf391fef0698944322b1a66649f6ada434))
* export UnicodeVersionFile ([afd781df](https://github.com/ucdjs/ucd/commit/afd781df13b98a3ef63a9b2ecb0cc07a950947f4))
* chore: more work ([babe61e3](https://github.com/ucdjs/ucd/commit/babe61e346598de8f48e3f47236893bf72ee3c22))
* chore: lint ([4499867d](https://github.com/ucdjs/ucd/commit/4499867dd282e93401a68df107a22350907cbd34))
* more work ([2dbbe5f0](https://github.com/ucdjs/ucd/commit/2dbbe5f05a2c8eb797a6f220c456646078f536c1))
* more work ([862f1881](https://github.com/ucdjs/ucd/commit/862f1881859fa19e7b810bfa1cc0b42dae6cbc68))
* more work ([a3249d32](https://github.com/ucdjs/ucd/commit/a3249d328d1648d8ee6e73b5fa7085d7430a1d74))
* chore: install ucd-store packages ([138eb36d](https://github.com/ucdjs/ucd/commit/138eb36d333f8f6f9b8b051df71710188083c5d6))


## 0.1.0

### Minor Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#174](https://github.com/ucdjs/ucd/pull/174) [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741) Thanks [@luxass](https://github.com/luxass)! - refactor: rewrite ucd store to be more modular

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#44](https://github.com/ucdjs/ucd/pull/44) [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946) Thanks [@luxass](https://github.com/luxass)! - simplify preconfigured filters

- [#206](https://github.com/ucdjs/ucd/pull/206) [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861) Thanks [@luxass](https://github.com/luxass)! - Implement Repair operation for UCD Store

- [#212](https://github.com/ucdjs/ucd/pull/212) [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35) Thanks [@luxass](https://github.com/luxass)! - feat: migrate from @ucdjs/utils to @ucdjs-internal/shared

  Updated internal imports to use `@ucdjs-internal/shared` instead of `@ucdjs/utils` for utilities like `safeJsonParse` and other shared patterns. This aligns with the new package structure where `@ucdjs-internal/shared` contains internal utilities and `@ucdjs/utils` focuses on public-facing utilities.

- [#209](https://github.com/ucdjs/ucd/pull/209) [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f) Thanks [@luxass](https://github.com/luxass)! - Store operations now return a result wrapper for improved error handling/reporting.

  ## What changed

  - All core operations (analyze, mirror, clean, repair) now return:
    - `{ success: boolean; data?: TData; errors: StoreError[] }`
    - On failures, `data` is undefined; on success, `data` is present.
  - Structured, serializable error payloads via `UCDStoreBaseError` → `StoreError` union.
  - Init options renamed: `StoreInitOptions` → `InitOptions` (re-exported).
  - `UCDStoreUnsupportedFeature` is an alias to `UCDStoreBridgeUnsupportedOperation`.

  ## Migration

  - Update call sites to read `result.success` and `result.data` instead of bare arrays.
  - Handle `result.errors` instead of catching thrown errors for operation failures.
  - If you referenced `StoreInitOptions`, switch to `InitOptions`.

  ## Notes

  - Concurrency validations return `{ success: false, data: undefined, errors: [...] }`.
  - Not-initialized scenarios no longer throw; they return `{ success: false, data: undefined, errors: [{ type: "NOT_INITIALIZED", ... }] }`.

- [#43](https://github.com/ucdjs/ucd/pull/43) [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea) Thanks [@luxass](https://github.com/luxass)! - support setting fs on local stores

- [#42](https://github.com/ucdjs/ucd/pull/42) [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0) Thanks [@luxass](https://github.com/luxass)! - implement filtering

- [#25](https://github.com/ucdjs/ucd/pull/25) [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12) Thanks [@luxass](https://github.com/luxass)! - implement ucd-store with local & remote functionality

- [#41](https://github.com/ucdjs/ucd/pull/41) [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e) Thanks [@luxass](https://github.com/luxass)! - rename filters to filterPatterns for consistency across UCDStore interfaces and implementations

- [#183](https://github.com/ucdjs/ucd/pull/183) [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1) Thanks [@luxass](https://github.com/luxass)! - implement analyze on ucd-store

- [#206](https://github.com/ucdjs/ucd/pull/206) [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861) Thanks [@luxass](https://github.com/luxass)! - Change analyze's return type to be `AnalyzeResult` instead of `VersionAnalysis`

- [#229](https://github.com/ucdjs/ucd/pull/229) [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3) Thanks [@luxass](https://github.com/luxass)! - feat: add error handling wrapper to fs-bridge operations

  Wraps all fs-bridge operation methods with automatic error handling to improve error management:

  - **Preserves custom bridge errors**: Re-throws `BridgeBaseError` instances (like `BridgePathTraversal`, `BridgeFileNotFound`) directly
  - **Wraps unexpected errors**: Converts unknown/system errors into `BridgeGenericError` with operation context
  - **Transparent to implementations**: Bridge implementations don't need to change - error handling is applied automatically

  ```typescript
  import {
    defineFileSystemBridge,
    BridgeFileNotFound,
    BridgeGenericError,
  } from "@ucdjs/fs-bridge";

  const bridgeCreator = defineFileSystemBridge({
    setup() {
      return {
        async read(path) {
          // If this throws a custom bridge error, it's re-thrown as-is
          if (!pathExists(path)) {
            throw new BridgeFileNotFound(path);
          }

          // If this throws an unexpected error (like network timeout),
          // it gets wrapped in BridgeGenericError with context
          return await fetchFile(path);
        },
      };
    },
  });

  const bridge = bridgeCreator();

  // Usage - all errors are now consistently handled
  try {
    await bridge.read("/some/path");
  } catch (error) {
    if (error instanceof BridgeFileNotFound) {
      // Handle specific bridge error
    } else if (error instanceof BridgeGenericError) {
      // Handle wrapped unexpected error
      console.log(error.originalError); // Access the original error
    }
  }
  ```

- [#189](https://github.com/ucdjs/ucd/pull/189) [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39) Thanks [@luxass](https://github.com/luxass)! - drop support for store capabilities, and utilize fs capabilities better

- [#76](https://github.com/ucdjs/ucd/pull/76) [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9) Thanks [@luxass](https://github.com/luxass)! - improve store

- [#96](https://github.com/ucdjs/ucd/pull/96) [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03) Thanks [@luxass](https://github.com/luxass)! - move @ucdjs/utils/ucd-files into @ucdjs/ucd-store/ucd-files

- [#187](https://github.com/ucdjs/ucd/pull/187) [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61) Thanks [@luxass](https://github.com/luxass)! - refactor capability code

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- [#218](https://github.com/ucdjs/ucd/pull/218) [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f) Thanks [@luxass](https://github.com/luxass)! - drop `toStoreError` function on Store Runtime Errors

- [#34](https://github.com/ucdjs/ucd/pull/34) [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40) Thanks [@luxass](https://github.com/luxass)! - feat: switch to picomatch

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#74](https://github.com/ucdjs/ucd/pull/74) [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55) Thanks [@luxass](https://github.com/luxass)! - Enhanced path filtering with extendable filters and temporary filter support.

  ```typescript
  const filter = createPathFilter(["*.txt"]);
  filter.extend(["!*Test*"]); // Add more patterns
  filter("file.js", ["*.js"]); // Use extra filters temporarily
  ```

- Updated dependencies [[`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4), [`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119), [`ce9b5a7`](https://github.com/ucdjs/ucd/commit/ce9b5a76795292aca5c9f8b6fd7021a66a34c28d), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3), [`46a6e81`](https://github.com/ucdjs/ucd/commit/46a6e8110dcc1ccef3a436bb18e67d92f0424213), [`7d98e29`](https://github.com/ucdjs/ucd/commit/7d98e29af2f9f6d681f9f2ee401baddf5a2c6ef6), [`2a44473`](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2), [`4fd46b4`](https://github.com/ucdjs/ucd/commit/4fd46b43613b23c1d120c71ae0754883eb9bf1ff), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b), [`39faaf5`](https://github.com/ucdjs/ucd/commit/39faaf585f3339296ef75c8a39893399ea48789f), [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640), [`170bbd1`](https://github.com/ucdjs/ucd/commit/170bbd1a8cfe23787d73e1052108261bb5956d01), [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234)]:
  - @ucdjs/fs-bridge@0.1.0
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/client@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0

## 0.0.1

### Patch Changes

- [#20](https://github.com/ucdjs/ucd/pull/20) [`5d804e3`](https://github.com/ucdjs/ucd/commit/5d804e31b1d6e36cb69f7a1de0722995355b5bf1) Thanks [@luxass](https://github.com/luxass)! - add initial ucd-store package
