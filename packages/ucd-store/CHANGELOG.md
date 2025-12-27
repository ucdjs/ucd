# @ucdjs/ucd-store

## [0.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/ucd-store@0.1.0...@ucdjs/ucd-store@0.1.0) (2025-11-24)


### Features
* add well-known handler for UCD configuration ([15212df0](https://github.com/ucdjs/ucd/commit/15212df0a3a0637671e8e5a53a4f606d9b031d33)) (by [@luxass](https://github.com/luxass))
* enhance UCD client initialization and error handling ([224c22ed](https://github.com/ucdjs/ucd/commit/224c22ed0fa2ad6483bb72f512965b9792fc7d1d)) (by [@luxass](https://github.com/luxass))
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* improve filter application in createPathFilter ([d3a11d5b](https://github.com/ucdjs/ucd/commit/d3a11d5b37ae13ad9c510f8b1ccf0fb6506a35ab)) (by [@luxass](https://github.com/luxass))
* enhance filtering options in getFileTree and getFilePaths ([c5335784](https://github.com/ucdjs/ucd/commit/c53357843da507204fd325f73af20a2df68780db)) (by [@luxass](https://github.com/luxass))
* add getFile method and update StoreInitOptions ([90f35232](https://github.com/ucdjs/ucd/commit/90f352323c725e49e18e9a9febd3649525742848)) (by [@luxass](https://github.com/luxass))
* add mirror functionality and types ([53937e0a](https://github.com/ucdjs/ucd/commit/53937e0a4041cef40bc96818cf89574c93616a7b)) (by [@luxass](https://github.com/luxass))
* add analysis functionality for UCD store ([e60ce1e6](https://github.com/ucdjs/ucd/commit/e60ce1e6dbfa9e9ce4cb80dd8700e6292bf6236f)) (by [@luxass](https://github.com/luxass))
* add cleaning functionality and types ([b944228c](https://github.com/ucdjs/ucd/commit/b944228cf1ef9e3ddf2c38cbbe01e50e89c1e024)) (by [@luxass](https://github.com/luxass))
* implement internal cleaning functionality ([ba6b79a0](https://github.com/ucdjs/ucd/commit/ba6b79a088e4efce257368d63a82f5eae5b7804b)) (by [@luxass](https://github.com/luxass))
* add clean functionality and enhance manifest handling ([1ac212ec](https://github.com/ucdjs/ucd/commit/1ac212ecfaef92565cd6a7d98070516c91f159ed)) (by [@luxass](https://github.com/luxass))
* optimize file and directory filtering in getFilePaths ([66558271](https://github.com/ucdjs/ucd/commit/665582718e8405a8d98dad77fd48c8be593653f5)) (by [@luxass](https://github.com/luxass))
* implement file tree filtering and structure ([f16729c6](https://github.com/ucdjs/ucd/commit/f16729c6080a6f010157ca305c93eb6f85d3fc94)) (by [@luxass](https://github.com/luxass))
* add getFile method for reading files with versioning and filtering ([109459c9](https://github.com/ucdjs/ucd/commit/109459c9fe31cf7a58ed173068b406922e9c89dc)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* add comprehensive tests for store initialization and version handling ([be470d64](https://github.com/ucdjs/ucd/commit/be470d64f8a3888751005204b34e73159c8741ce)) (by [@luxass](https://github.com/luxass))
* enhance store initialization and add mirroring functionality ([cb2c6db9](https://github.com/ucdjs/ucd/commit/cb2c6db98d303ea0bcab2cdc1caa90f2e88e2865)) (by [@luxass](https://github.com/luxass))
* add MirrorOptions and MirrorResult interfaces ([2ed53dc7](https://github.com/ucdjs/ucd/commit/2ed53dc7afeac5617788d2bdbc6e707bed684f72)) (by [@luxass](https://github.com/luxass))
* add support for versions in UCDStore constructor ([8aacb201](https://github.com/ucdjs/ucd/commit/8aacb20120de7eafbf232165d1a0bd59de83bcee)) (by [@luxass](https://github.com/luxass))
* enhance error handling in getExpectedFilePaths function ([1b2dc8db](https://github.com/ucdjs/ucd/commit/1b2dc8dbf4cf2ea4dc9928855f03d965f752ffae)) (by [@luxass](https://github.com/luxass))
* add getExpectedFilePaths function to retrieve file paths for Unicode versions ([c4eb5397](https://github.com/ucdjs/ucd/commit/c4eb53972670c860a13825ed1b2b371bac5dd074)) (by [@luxass](https://github.com/luxass))
* implement #analyzeVersion method for version analysis ([a626eacf](https://github.com/ucdjs/ucd/commit/a626eacf517f09ae5568bfb010aeb168a08365d1)) (by [@luxass](https://github.com/luxass))
* add analyze method for version analysis ([1cd85474](https://github.com/ucdjs/ucd/commit/1cd8547429725e0f659ca9892cb5904e519e1c56)) (by [@luxass](https://github.com/luxass))
* enhance initialization logging for debugging ([e84da432](https://github.com/ucdjs/ucd/commit/e84da432baba35893486864cdbe09778b722bc34)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* enhance UCDStore initialization and manifest loading ([598e2fec](https://github.com/ucdjs/ucd/commit/598e2fec810274fd1801cf50dd2935669f7253d6)) (by [@luxass](https://github.com/luxass))
* update versions getter to return readonly array and fix import path for HTTP filesystem ([6fe7150e](https://github.com/ucdjs/ucd/commit/6fe7150e198b0793bb56e6245854458de03b5ff6)) (by [@luxass](https://github.com/luxass))
* update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5)) (by [@luxass](https://github.com/luxass))
* add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2)) (by [@luxass](https://github.com/luxass))
* add `versions` getter to expose immutable version set ([ae044aed](https://github.com/ucdjs/ucd/commit/ae044aed56476b9206c8a8c929517d8eeb9f72f1)) (by [@luxass](https://github.com/luxass))
* update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e)) (by [@luxass](https://github.com/luxass))
* add new playground scripts and logger utility ([b920e96a](https://github.com/ucdjs/ucd/commit/b920e96ad4a44fb1282d16f7ac82e1a64c1e5392)) (by [@luxass](https://github.com/luxass))
* implement UCDStore with filesystem capabilities ([71ec7472](https://github.com/ucdjs/ucd/commit/71ec74727921fad1a32374eb95e40280f85cff21)) (by [@luxass](https://github.com/luxass))
* add UCDStoreUnsupportedFeature error class ([7342132a](https://github.com/ucdjs/ucd/commit/7342132aa776cf8bf7683039c129b46e11193320)) (by [@luxass](https://github.com/luxass))
* update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74)) (by [@luxass](https://github.com/luxass))
* add custom error classes for UCDStore ([574697b8](https://github.com/ucdjs/ucd/commit/574697b89e5fa78305a1b98579aebef99fa437a7)) (by [@luxass](https://github.com/luxass))
* add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f)) (by [@luxass](https://github.com/luxass))
* add tests for mirrorUCDFiles and validateUCDFiles functions ([3214f78e](https://github.com/ucdjs/ucd/commit/3214f78eeb246cdf86799834e8993c0ca4f98d9e)) (by [@luxass](https://github.com/luxass))
* add &#39;dev:api&#39; script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)) (by [@luxass](https://github.com/luxass))
* initialize UCDStore instances on creation ([dceca516](https://github.com/ucdjs/ucd/commit/dceca516a6aa80d391eebf696f118479ec525c44)) (by [@luxass](https://github.com/luxass))
* implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))
* add filesystem abstraction to ucd-store ([c5a7c772](https://github.com/ucdjs/ucd/commit/c5a7c772d74a73a140246daac8034ab5d732783d)) (by [@luxass](https://github.com/luxass))
* implement options for disabling default excludes ([69bc180a](https://github.com/ucdjs/ucd/commit/69bc180a322659ad65078c66ea8422af163efb2e)) (by [@luxass](https://github.com/luxass))
* add preconfigured filters for path filtering functionality ([be0a7e1f](https://github.com/ucdjs/ucd/commit/be0a7e1f80a4fd14d2ef3667927cfaa56d657408)) (by [@luxass](https://github.com/luxass))
* add path filtering functionality to ucd-store ([5c878c4b](https://github.com/ucdjs/ucd/commit/5c878c4b35d29754e8411730cd9e8c6852dc73a5)) (by [@luxass](https://github.com/luxass))
* enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588)) (by [@luxass](https://github.com/luxass))
* switch to picomatch ([cbc1e497](https://github.com/ucdjs/ucd/commit/cbc1e497c1d738e8818c3ef140648190e62289f8)) (by [@luxass](https://github.com/luxass))
* implement repairStore function for validating and downloading missing files ([f3b06bba](https://github.com/ucdjs/ucd/commit/f3b06bba0a76630aed4b94b056f5040ab3f597c8)) (by [@luxass](https://github.com/luxass))
* add playground scripts for local and remote UCDStore ([72e2596a](https://github.com/ucdjs/ucd/commit/72e2596a2c0b31a906f0e690f4e947c6c5d166ea)) (by [@luxass](https://github.com/luxass))
* implement LocalUCDStore with version management and validation, remove metadata.ts ([cc7d84e3](https://github.com/ucdjs/ucd/commit/cc7d84e3383d600b82f1ae234eff9a031657d8b3)) (by [@luxass](https://github.com/luxass))
* replace fetchWithRetry with promiseRetry in RemoteUCDStore, update utils version to 2.3.0 ([1aa5b3f5](https://github.com/ucdjs/ucd/commit/1aa5b3f50bfd661144333a232e05309903797f16)) (by [@luxass](https://github.com/luxass))
* implement file handling methods in LocalUCDStore and RemoteUCDStore, update utils version ([9aa3e7a1](https://github.com/ucdjs/ucd/commit/9aa3e7a1638e8eb7914c2cc38605246057d2bb91)) (by [@luxass](https://github.com/luxass))
* add UCD version store validation ([6bfbe2d4](https://github.com/ucdjs/ucd/commit/6bfbe2d4ed85342f4940a84e017902532443c26c)) (by [@luxass](https://github.com/luxass))
* implement UCDStore with local and remote modes, add validation and metadata schemas ([af2be3e2](https://github.com/ucdjs/ucd/commit/af2be3e23dcc09a3b144e728724fba3dc43fdee8)) (by [@luxass](https://github.com/luxass))
* add ucd-store ([467cccda](https://github.com/ucdjs/ucd/commit/467cccdabe4a2d937f3479aa846ec96ac8961b80)) (by [@luxass](https://github.com/luxass))

### Bug Fixes
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* replace `@luxass/unicode-utils-new` with `@luxass/unicode-utils` ([301056ad](https://github.com/ucdjs/ucd/commit/301056ad6d16ec0de30ce8e6e611db4d59ab3e9b)) (by [@luxass](https://github.com/luxass))
* remove unnecessary assertions ([28cff89f](https://github.com/ucdjs/ucd/commit/28cff89f28b63800c81e036bd014c9fd07706c93)) (by [@luxass](https://github.com/luxass))
* update import paths for setupMockStore ([c667ffa7](https://github.com/ucdjs/ucd/commit/c667ffa7e5e893ddd89ca14232909c9764871539)) (by [@luxass](https://github.com/luxass))
* update filter pattern assertion to use arrayContaining ([e49c74ba](https://github.com/ucdjs/ucd/commit/e49c74ba749183916dd43209aca5974482c4b7b9)) (by [@luxass](https://github.com/luxass))
* enhance error messages for filtered paths and API failures ([ee9840cb](https://github.com/ucdjs/ucd/commit/ee9840cb1fd50054cc4e6446047858486e502a04)) (by [@luxass](https://github.com/luxass))
* improve error handling for file not found ([6d7cd476](https://github.com/ucdjs/ucd/commit/6d7cd4765d5f4a4a348c44a88ef352f885ab130c)) (by [@luxass](https://github.com/luxass))
* improve error handling in getExpectedFilePaths ([2d8753bb](https://github.com/ucdjs/ucd/commit/2d8753bb6c3fbbca7e0cc74087d22aea8964d20a)) (by [@luxass](https://github.com/luxass))
* ensure positive concurrency in clean, mirror, and repair functions ([6b8d705e](https://github.com/ucdjs/ucd/commit/6b8d705e1169c97c7ccde4a72a5cf0737d523171)) (by [@luxass](https://github.com/luxass))
* improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e)) (by [@luxass](https://github.com/luxass))
* improve error handling in internal__clean and update test assertions ([54e721ea](https://github.com/ucdjs/ucd/commit/54e721ea8f23350f3d751607227ddc8b0aefdbf6)) (by [@luxass](https://github.com/luxass))
* enhance version existence check and update tests ([46e55077](https://github.com/ucdjs/ucd/commit/46e550776f63f3392da93d9c1ed820ac61572917)) (by [@luxass](https://github.com/luxass))
* update success response for clean and mirror operations ([54b0c49b](https://github.com/ucdjs/ucd/commit/54b0c49b230812d0ede21fa15fa121e5e008a642)) (by [@luxass](https://github.com/luxass))
* improve error messages and handling in repair process ([a139798b](https://github.com/ucdjs/ucd/commit/a139798b7fee1331be361c3f4e7e0d7e8ef6f442)) (by [@luxass](https://github.com/luxass))
* improve file analysis logic for orphaned and missing files ([5519cd02](https://github.com/ucdjs/ucd/commit/5519cd025159a727e734cc0f7eaabe5dad827686)) (by [@luxass](https://github.com/luxass))
* enforce minimum concurrency requirement in cleaning process ([3b17ec09](https://github.com/ucdjs/ucd/commit/3b17ec095ceca6f3bdd6f5aa1ef3d6f705dbfbea)) (by [@luxass](https://github.com/luxass))
* ensure proper initialization checks in file operations ([7907bfcd](https://github.com/ucdjs/ucd/commit/7907bfcde7c1cdfcb8b8d616c8c21376014e27f3)) (by [@luxass](https://github.com/luxass))
* correct skipped files logic in internal__repair function ([ac2adb04](https://github.com/ucdjs/ucd/commit/ac2adb04b47502d1dabb91910fb679b5f98e7045)) (by [@luxass](https://github.com/luxass))
* make `baseUrl` optional in `MockStoreConfig` ([5c6849f2](https://github.com/ucdjs/ucd/commit/5c6849f27f7db362e5d91f5210dac60742209e66)) (by [@luxass](https://github.com/luxass))
* update orphaned files assertion to use toEqual for accuracy ([18d9cbdf](https://github.com/ucdjs/ucd/commit/18d9cbdfb0b337ac168e974f3e87622cf6baad3b)) (by [@luxass](https://github.com/luxass))
* update orphaned files assertion for accuracy ([5f2e96ba](https://github.com/ucdjs/ucd/commit/5f2e96ba908a9ae6b4f93535f7d83ec47c599411)) (by [@luxass](https://github.com/luxass))
* enhance file reading logic to handle absolute paths ([cd64bfa0](https://github.com/ucdjs/ucd/commit/cd64bfa08d09c66b34c84a188e769d2a293f686f)) (by [@luxass](https://github.com/luxass))
* improve error handling for file read operations ([af0f4e33](https://github.com/ucdjs/ucd/commit/af0f4e33f15aebc3d457a42e8ad400376d113e5b)) (by [@luxass](https://github.com/luxass))
* correct basePath assignment in createNodeUCDStore ([ba0c89ef](https://github.com/ucdjs/ucd/commit/ba0c89efe94cb10a0a54870915e37ef991b15800)) (by [@luxass](https://github.com/luxass))
* update error message for UCDStoreVersionNotFoundError ([90ca7004](https://github.com/ucdjs/ucd/commit/90ca70043a6a929ed6a960d33c45a727400b7e99)) (by [@luxass](https://github.com/luxass))
* improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf)) (by [@luxass](https://github.com/luxass))
* adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9)) (by [@luxass](https://github.com/luxass))
* correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04)) (by [@luxass](https://github.com/luxass))
* correct manifest data path resolution ([a12828a8](https://github.com/ucdjs/ucd/commit/a12828a8c87397b27f9f8f3af58fcd71ef0a32f1)) (by [@luxass](https://github.com/luxass))
* correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead)) (by [@luxass](https://github.com/luxass))
* set default basePath to &#39;./&#39; in createNodeUCDStore ([b27073ee](https://github.com/ucdjs/ucd/commit/b27073eef4240de61fa59ecfda5294f342f1fca9)) (by [@luxass](https://github.com/luxass))
* remove unused error import in files.test.ts ([2dd1e822](https://github.com/ucdjs/ucd/commit/2dd1e822174c5480b4ad12e3bb861cbfa3cee275)) (by [@luxass](https://github.com/luxass))
* set default basePath to &#39;./&#39; in createNodeUCDStore ([508e1bd0](https://github.com/ucdjs/ucd/commit/508e1bd03705d7ebdc445836ba15c817396fdcb4)) (by [@luxass](https://github.com/luxass))
* throw error for invalid JSON in store manifest ([08c95029](https://github.com/ucdjs/ucd/commit/08c950298eed92bec421918fc9b3224eaddb0e49)) (by [@luxass](https://github.com/luxass))
* update `.ucd-store.json` initialization to use an empty object ([8b5cf8d2](https://github.com/ucdjs/ucd/commit/8b5cf8d2ce9a22c2fd95c1a64839e512db5afc70)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))
* update API URLs in test files ([9dff312a](https://github.com/ucdjs/ucd/commit/9dff312a4ef4cdfeb26e6a263dc399eb07e1eb7f)) (by [@luxass](https://github.com/luxass))
* update default URLs to use constants ([613e235f](https://github.com/ucdjs/ucd/commit/613e235fc1f616af75671f4de70889b6fa9094cc)) (by [@luxass](https://github.com/luxass))
* ensure fs-extra module is loaded correctly with error handling ([e14959e3](https://github.com/ucdjs/ucd/commit/e14959e31a0a485be7678fc76029a72c8d8f2c18)) (by [@luxass](https://github.com/luxass))
* use correct exports in index ([fd05e283](https://github.com/ucdjs/ucd/commit/fd05e283f45a5f15c8fbe92881a54c5716f287a8)) (by [@luxass](https://github.com/luxass))
* exclude ucd metadata errors in tests ([932c6ff5](https://github.com/ucdjs/ucd/commit/932c6ff5a2e201dc700e25ad620728c0f6034a4a)) (by [@luxass](https://github.com/luxass))
* use safe json parse in ucd metadata ([dff8260d](https://github.com/ucdjs/ucd/commit/dff8260df5077829a5591f2db13ae67d772ce476)) (by [@luxass](https://github.com/luxass))

### Refactoring
* simplify mock responses for API versioning ([79c16c9b](https://github.com/ucdjs/ucd/commit/79c16c9b02baacb21e944d480daf33b7b1a1304f)) (by [@luxass](https://github.com/luxass))
* prefer for bridge capability change ([0a9500e4](https://github.com/ucdjs/ucd/commit/0a9500e4f2f98f89bd4ebfbfae377693c5eccc0c)) (by [@luxass](https://github.com/luxass))
* remove `createMemoryMockFS` implementation ([cfb7e3ff](https://github.com/ucdjs/ucd/commit/cfb7e3ff801e1a5a8111f217d027dbf6fd4e80a0)) (by [@luxass](https://github.com/luxass))
* rename `metadata` to `meta` in bridge definitions ([1dd5e3f1](https://github.com/ucdjs/ucd/commit/1dd5e3f1d4d46290be8a051005fce145426feb22)) (by [@luxass](https://github.com/luxass))
* update bridge definitions to use metadata structure ([d52516d8](https://github.com/ucdjs/ucd/commit/d52516d86dbf45564eb4bffde7e2bbf5609d8ee6)) (by [@luxass](https://github.com/luxass))
* remove pre-configured client instance and update tests ([0d2a30fb](https://github.com/ucdjs/ucd/commit/0d2a30fb6de590c0997fe16dad0cbd9620c46fbd)) (by [@luxass](https://github.com/luxass))
* rename @ucdjs/fetch to @ucdjs/client ([396f59f1](https://github.com/ucdjs/ucd/commit/396f59f1554aff152f2f34848b670bc318f2e06a)) (by [@luxass](https://github.com/luxass))
* rename `setupMockStore` to `mockStoreApi` ([36bd17a2](https://github.com/ucdjs/ucd/commit/36bd17a29d2f15c3ab6c2ca0bf86e0bfee8ee7ea)) (by [@luxass](https://github.com/luxass))
* update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab)) (by [@luxass](https://github.com/luxass))
* update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801)) (by [@luxass](https://github.com/luxass))
* rename variable for clarity in getFileTree method ([33ea5000](https://github.com/ucdjs/ucd/commit/33ea5000dae783bd639be0aacff1a5ea9909d5e8)) (by [@luxass](https://github.com/luxass))
* update test for disallowing file access outside the store ([3d121f98](https://github.com/ucdjs/ucd/commit/3d121f986a4f5ccfa03869f320e1d49ddc49a809)) (by [@luxass](https://github.com/luxass))
* rename UCDStoreError to UCDStoreGenericError ([a1eb9e5e](https://github.com/ucdjs/ucd/commit/a1eb9e5e189a69a551fc2d2bba3e35b5a65f64e8)) (by [@luxass](https://github.com/luxass))
* update repair and file tree methods to return data and error ([45eae523](https://github.com/ucdjs/ucd/commit/45eae523f1c0bf70aec90fb0cb46426b8b3733ee)) (by [@luxass](https://github.com/luxass))
* improve error handling and return types ([3f2ad1f2](https://github.com/ucdjs/ucd/commit/3f2ad1f2de416a5e3e40d595e61d012f94f06bf8)) (by [@luxass](https://github.com/luxass))
* migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa)) (by [@luxass](https://github.com/luxass))
* move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91)) (by [@luxass](https://github.com/luxass))
* remove empty data fields from error responses ([2583f433](https://github.com/ucdjs/ucd/commit/2583f4332b7a9413ad3c6d10c62507c2c9d367d4)) (by [@luxass](https://github.com/luxass))
* improve error handling for uninitialized store ([b5faa2e7](https://github.com/ucdjs/ucd/commit/b5faa2e72e242e0591fd2c8d0fd81e338e38a96e)) (by [@luxass](https://github.com/luxass))
* streamline concurrency handling in internal__mirror function ([abde2c1d](https://github.com/ucdjs/ucd/commit/abde2c1deba2a984d54d6ad8c00eb9b91ba94d32)) (by [@luxass](https://github.com/luxass))
* add note on response text decoding ([613cb0dd](https://github.com/ucdjs/ucd/commit/613cb0dd3a4435f3b0f8c196b04ff24a1220bc4f)) (by [@luxass](https://github.com/luxass))
* streamline result handling in internal__mirror function ([900749d3](https://github.com/ucdjs/ucd/commit/900749d39d39d8414a7e5529534cf25a9235b387)) (by [@luxass](https://github.com/luxass))
* enhance store analysis process ([ea85bb45](https://github.com/ucdjs/ucd/commit/ea85bb459c4565d3297e2df35a9b6db1f2e77d9f)) (by [@luxass](https://github.com/luxass))
* enhance analyze method to return structured result ([26aa69b5](https://github.com/ucdjs/ucd/commit/26aa69b560b09bd4bf5cb7ababdd2f42c1f0b7be)) (by [@luxass](https://github.com/luxass))
* update clean method to return structured result ([c052de9a](https://github.com/ucdjs/ucd/commit/c052de9a0c2fa4d002ad35688c2953cddfc38708)) (by [@luxass](https://github.com/luxass))
* migrate repair to new result type ([7650ff8c](https://github.com/ucdjs/ucd/commit/7650ff8c4aa9f6b58fe6e1629b25d5488473a48b)) (by [@luxass](https://github.com/luxass))
* improve error handling and response processing ([29624de9](https://github.com/ucdjs/ucd/commit/29624de96a06f1a46992c68de2569897b252daca)) (by [@luxass](https://github.com/luxass))
* simplify error class hierarchy and improve type definitions ([3c50addd](https://github.com/ucdjs/ucd/commit/3c50addd3d3de45d56fd4e52970211cca49d2bd2)) (by [@luxass](https://github.com/luxass))
* restructure error handling and introduce StoreError type ([53efb09a](https://github.com/ucdjs/ucd/commit/53efb09a962e83b8c8dbc66453ff1c775af8d619)) (by [@luxass](https://github.com/luxass))
* rename StoreInitOptions to InitOptions ([b1a910f3](https://github.com/ucdjs/ucd/commit/b1a910f3f9668f472813fd1b421b5d26045bb5f0)) (by [@luxass](https://github.com/luxass))
* change store operations to be more stream lined ([a67bedd4](https://github.com/ucdjs/ucd/commit/a67bedd406d06d1d52e616aa42d79a627ed571fd)) (by [@luxass](https://github.com/luxass))
* simplify store creation functions and update return types ([253cba2c](https://github.com/ucdjs/ucd/commit/253cba2c4d6d8dd402ab978e6ce1e8919605bac3)) (by [@luxass](https://github.com/luxass))
* rename `initialize` to `init` and update usage ([474b5c57](https://github.com/ucdjs/ucd/commit/474b5c57bbb800908313e4b9c6b099a79eb1fd64)) (by [@luxass](https://github.com/luxass))
* remove StoreCapabilities and related logic ([1a6e079f](https://github.com/ucdjs/ucd/commit/1a6e079fc569891aacd336786e9507b9ffa335fc)) (by [@luxass](https://github.com/luxass))
* update FileSystemBridge integration and capabilities handling ([c2f7e5d3](https://github.com/ucdjs/ucd/commit/c2f7e5d3d05170bd6a83697572b2f454a6d86dcb)) (by [@luxass](https://github.com/luxass))
* improve file path handling and analysis logic ([3d586c5b](https://github.com/ucdjs/ucd/commit/3d586c5b14d8f0e49c4fc107a0a4fb4f674ba239)) (by [@luxass](https://github.com/luxass))
* reorganize error exports for clarity ([b292d738](https://github.com/ucdjs/ucd/commit/b292d73863023bc2be684186d8526ed751534882)) (by [@luxass](https://github.com/luxass))
* reorganize error exports for clarity ([4d5cfb2a](https://github.com/ucdjs/ucd/commit/4d5cfb2a024dc612418e99c5eedd2b1ad27e5e57)) (by [@luxass](https://github.com/luxass))
* remove unused export of flattenFilePaths ([1e3b78e0](https://github.com/ucdjs/ucd/commit/1e3b78e03d8e07879e7813eb9497ee7cca287c0d)) (by [@luxass](https://github.com/luxass))
* update file tree types and import flattenFilePaths from utils ([c3cb6344](https://github.com/ucdjs/ucd/commit/c3cb6344d227a8c49883f942ba668c09a0677e7d)) (by [@luxass](https://github.com/luxass))
* rename FileTreeNode to UnicodeTreeNode and update related schemas ([7f366e53](https://github.com/ucdjs/ucd/commit/7f366e531644413e4701a4ceab7f7b579eecade4)) (by [@luxass](https://github.com/luxass))
* update default base URL for remote store ([add5c0a7](https://github.com/ucdjs/ucd/commit/add5c0a7badfbe2e13d0a8bf20c02782ed0462fe)) (by [@luxass](https://github.com/luxass))
* streamline store initialization and manifest handling ([de5eb013](https://github.com/ucdjs/ucd/commit/de5eb013c1c4d1f9634ef81c934dd538b267c73f)) (by [@luxass](https://github.com/luxass))
* simplify filter application in UCDStore ([dc8fbc7d](https://github.com/ucdjs/ucd/commit/dc8fbc7dcb008545e50c74a6ad82cdc0d4994374)) (by [@luxass](https://github.com/luxass))
* update `PathFilter` methods for improved filter management ([64e60659](https://github.com/ucdjs/ucd/commit/64e606598e497f67d8fd059e076a88f7fe406c15)) (by [@luxass](https://github.com/luxass))
* simplify filter handling in file processing ([a6eee96a](https://github.com/ucdjs/ucd/commit/a6eee96aefa2600c9cd2eca3f5caada9748e1343)) (by [@luxass](https://github.com/luxass))
* update filter type and enhance file retrieval methods ([cf7f7b1d](https://github.com/ucdjs/ucd/commit/cf7f7b1d185a56c0e59f78bbac412d2305ba7439)) (by [@luxass](https://github.com/luxass))
* replace `createUCDStore` with specific local and remote store creation functions ([4c824601](https://github.com/ucdjs/ucd/commit/4c824601f7bde6d24ad0afb5290023d39fd7227d)) (by [@luxass](https://github.com/luxass))
* replace hardcoded URLs with constants and improve store initialization ([3ea42a18](https://github.com/ucdjs/ucd/commit/3ea42a18899b4820df7672c0e37b8387e90fcf20)) (by [@luxass](https://github.com/luxass))
* unify UCDStore implementation and remove legacy classes ([5a9bea8d](https://github.com/ucdjs/ucd/commit/5a9bea8df2883ee00e5c6d79d44532b857737208)) (by [@luxass](https://github.com/luxass))
* remove local and remote UCD store implementations ([29f0f599](https://github.com/ucdjs/ucd/commit/29f0f599b53782a13ce97445135a738fa7f1901d)) (by [@luxass](https://github.com/luxass))
* remove deprecated FsInterface tests and related code; implement repairUCDFiles functionality with improved error handling and file downloading logic ([9d37fafe](https://github.com/ucdjs/ucd/commit/9d37fafe0ba0d4fef419d1b43717634d58191166)) (by [@luxass](https://github.com/luxass))
* remove FsInterface and related functions; update download logic to use buildUCDPath ([d3ee25dc](https://github.com/ucdjs/ucd/commit/d3ee25dc3c9dc22242f1ed4485047f3bc0cd7eba)) (by [@luxass](https://github.com/luxass))
* replace internal flattenFilePaths method with utility function ([eca5fc39](https://github.com/ucdjs/ucd/commit/eca5fc3955add4c966f70f44741512356dc10d30)) (by [@luxass](https://github.com/luxass))
* update imports to use utils package for PRECONFIGURED_FILTERS ([5ac735ab](https://github.com/ucdjs/ucd/commit/5ac735ab53f701b664575d2762442a4f19b35c46)) (by [@luxass](https://github.com/luxass))
* move filter functionality from ucd-store to utils package ([98b84b07](https://github.com/ucdjs/ucd/commit/98b84b07af8c09a3b8881af95a5fdf99d4afb52e)) (by [@luxass](https://github.com/luxass))
* move UnicodeVersionFile type to unicode-utils-new/fetch ([69858bf6](https://github.com/ucdjs/ucd/commit/69858bf68adf7ca0b7c4ee5d3f2a75c03946af20)) (by [@luxass](https://github.com/luxass))
* remove unused buildProxyUrl function and update fetch call to use URL constructor ([d8ced9be](https://github.com/ucdjs/ucd/commit/d8ced9bec1a5937ef07d243caec23b5a19ff0300)) (by [@luxass](https://github.com/luxass))
* update filter patterns to use consistent naming for exclusion filters ([6b25c005](https://github.com/ucdjs/ucd/commit/6b25c00550812568759a370fc4c59c95daf5720d)) (by [@luxass](https://github.com/luxass))
* remove filterPatterns from UCDStore interfaces and update related classes ([a94430ce](https://github.com/ucdjs/ucd/commit/a94430cebf4dd1648eae499fdf5812292f18d81f)) (by [@luxass](https://github.com/luxass))
* remove unused file filtering options ([73cc0133](https://github.com/ucdjs/ucd/commit/73cc0133cb7b0eac8f22fdd23bcc3a099925764c)) (by [@luxass](https://github.com/luxass))
* change fs-interface ([72e6ae96](https://github.com/ucdjs/ucd/commit/72e6ae96604baeb64cbc4186442b332749be135e)) (by [@luxass](https://github.com/luxass))
* simplify PRECONFIGURED_FILTERS from arrays to strings ([b68336b4](https://github.com/ucdjs/ucd/commit/b68336b438987f1d81e5dc7aa8b5768e8d6e77af)) (by [@luxass](https://github.com/luxass))
* replace picomatch with createPathFilter for improved path filtering in RemoteUCDStore ([a74bc542](https://github.com/ucdjs/ucd/commit/a74bc542a2d68685bcdefec4d598e076a51bc43e)) (by [@luxass](https://github.com/luxass))
* rename filters to filterPatterns for consistency across UCDStore interfaces and implementations ([7da35681](https://github.com/ucdjs/ucd/commit/7da35681595e776d6d6f8106a511711b387916d6)) (by [@luxass](https://github.com/luxass))
* replace mkdirp with mkdir with recursive option in repairLocalStore ([a8f7190a](https://github.com/ucdjs/ucd/commit/a8f7190a6092a07721ad8689b24735655fef1b0d)) (by [@luxass](https://github.com/luxass))
* simplify imports in local.ts by removing unused types ([9e9bb735](https://github.com/ucdjs/ucd/commit/9e9bb735aece80cb995ac16a718a7342266f5527)) (by [@luxass](https://github.com/luxass))
* update LocalUCDStore to improve initialization and validation logic ([12a6caf8](https://github.com/ucdjs/ucd/commit/12a6caf835299d2accbbee7fd4eebbd89ddd8067)) (by [@luxass](https://github.com/luxass))
* update file cache access to private class field and improve URL construction ([4ed626dd](https://github.com/ucdjs/ucd/commit/4ed626dd11b388259ef2c759af5e43fdddc68c85)) (by [@luxass](https://github.com/luxass))
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
