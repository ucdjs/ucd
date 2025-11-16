# @ucdjs/fs-bridge

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.0...@ucdjs/fs-bridge@0.2.0) (2025-11-16)

### Features

* feat(fs-bridge): add utility functions for hook payload construction and operation wrapping ([f90f3b87](https://github.com/ucdjs/ucd/commit/f90f3b873044aaecac01aa96df13b2adc58582be))
* feat(fs-bridge): upgrade hookable (#378) ([#378](https://github.com/ucdjs/ucd/issues/378)) ([4591756b](https://github.com/ucdjs/ucd/commit/4591756bac443dd4b2a7c1c7e0f66e4d69edb11b))
* feat(fs-bridge): add `encoding` property to hook payload for `write:before` ([c5de8fbe](https://github.com/ucdjs/ucd/commit/c5de8fbeba60bb699bfd5443dade1c3abcf0bfee))
* feat(fs-bridge): enhance hook payload types and improve type safety ([677ab0e2](https://github.com/ucdjs/ucd/commit/677ab0e27ef74a5842cf3655ff8d9dbefc06ff5c))
* feat(fs-bridge): enhance `rm` operation payload and update hook signatures ([6ef1d6d2](https://github.com/ucdjs/ucd/commit/6ef1d6d2d98de13706656a77b987f0677a373498))
* feat(fs-bridge): define supported bridge operations ([4a2df972](https://github.com/ucdjs/ucd/commit/4a2df97258d9e551ba5768756e6ce2ac39cd826f))
* feat(fs-bridge): integrate hooks for file system operations ([9e8dbe64](https://github.com/ucdjs/ucd/commit/9e8dbe6444a291ee7f590ca63468d0567cbd14c5))
* feat(fs-bridge): add `hasCapability` function to guard bridge capabilities ([7df47eb7](https://github.com/ucdjs/ucd/commit/7df47eb7d4a8f71f533dece8eb451b4bbb241456))
* feat(fs-bridge): add FileSystemBridgeFactory type export ([8d42c7f9](https://github.com/ucdjs/ucd/commit/8d42c7f9165b6c11cd84b26f9bb04b77251ec0f0))
* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(fs-bridge): add support for data mirroring in FileSystemBridgeMetadata ([f5df4435](https://github.com/ucdjs/ucd/commit/f5df4435bdaeb482eec7821d05bbc4c9a44fa55a))
* feat(fs-bridge): make metadata optional in FileSystemBridge interfaces ([9f202d0a](https://github.com/ucdjs/ucd/commit/9f202d0a5795cf1a19ddf9be61ce4bb926b72afd))
* feat(fs-bridge): add metadata and descriptive fields to HTTP and Node.js bridges ([7bf84348](https://github.com/ucdjs/ucd/commit/7bf84348f754296579d7965fc65e8a58aee09c04))
* feat(fs-bridge): enhance FileSystemBridge with metadata and descriptive fields ([a35231e3](https://github.com/ucdjs/ucd/commit/a35231e30985f277af04a005380923a49e90ef42))
* feat(fs-bridge): add BridgeSetupError class for enhanced error handling ([473b7255](https://github.com/ucdjs/ucd/commit/473b7255bfc71e33547c9b95cb68f6dfffb3aa04))
* feat(fs-bridge): integrate `resolveSafePath` into file system bridge setup ([5cadac4d](https://github.com/ucdjs/ucd/commit/5cadac4df129cace5b6c4ded1b760853eed5c646))
* feat(fs-bridge): add path resolution functions for security ([c9ff1916](https://github.com/ucdjs/ucd/commit/c9ff19164fb0d352ad18e6fa24fd72c49a28d9d2))
* feat(web): update TypeScript configuration and add tsconfig dependency ([fcd13059](https://github.com/ucdjs/ucd/commit/fcd13059257d336b31620a5fd64fc2cdff0192e9))
* feat(ucd-store): add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37))
* feat(fs-bridge): support Uint8Array ([2f554138](https://github.com/ucdjs/ucd/commit/2f554138b55bd5e0624071f0798e5f40ef6cb651))
* feat(fs-bridge): implement capability assertion and error handling ([43ef6402](https://github.com/ucdjs/ucd/commit/43ef6402e9e539353fc20adb9ca6b7c3389b9767))
* feat(fs-bridge): enhance `resolveSafePath` to handle absolute paths within base ([c82c2f65](https://github.com/ucdjs/ucd/commit/c82c2f65aecabd535d70ad427200f628385aa65e))
* feat(fs-bridge): enhance path resolution security and add tests for root base behavior ([e00d95c7](https://github.com/ucdjs/ucd/commit/e00d95c720ce0c9bced7a06fe636b1b83a68605c))
* feat(fs-bridge): enhance path validation and security measures ([a49c12f4](https://github.com/ucdjs/ucd/commit/a49c12f466bf5d395e0ac298aeab17009df82186))
* feat(ucd-store): update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689))
* feat(fs-bridge): update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5))
* feat(fs-bridge): add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2))
* feat(ucd-store): update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e))
* feat(fs-bridge): add debug symbol to file system bridge ([6763abcd](https://github.com/ucdjs/ucd/commit/6763abcd8202777afdfb418e185f1b548e9c713c))
* feat(fs-bridge): update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74))
* feat(fs-bridge): add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f))

### Bug Fixes

* fix(fs-bridge): improve error handling in `handleError` function ([4ad7725c](https://github.com/ucdjs/ucd/commit/4ad7725c82ccb107d35d2ca405c0c469c4fc0b82))
* fix(fs-bridge): convert strings to errors ([e5da9589](https://github.com/ucdjs/ucd/commit/e5da95891c6d22233cd2f60769585e45a68e14e9))
* fix: update file paths to include 'extracted' prefix (#371) ([#371](https://github.com/ucdjs/ucd/issues/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243))
* fix(fs-bridge): make hooks call asynchronous and ensure proper error handling ([32d96256](https://github.com/ucdjs/ucd/commit/32d962567f775e11415f5e85c59afe46980b3dd5))
* fix(fs-bridge): replace `hooxs` with `hookable` and update hook method calls ([666ac4c1](https://github.com/ucdjs/ucd/commit/666ac4c173c9177b07aa26bf19350fb836adce32))
* fix(fs-bridge): update `entries` type in hook payload to use `FSEntry[]` ([96d73c06](https://github.com/ucdjs/ucd/commit/96d73c06dc4d0e446640b7a7c0627afb3fc72a3d))
* fix(fs-bridge): correct unsupported operation handling in defineFileSystemBridge ([722f516c](https://github.com/ucdjs/ucd/commit/722f516c7f6518dfdbdc7725f2da6a72b3505f7b))
* fix(fs-bridge): use `structuredClone` for state in `defineFileSystemBridge` ([cb28a42e](https://github.com/ucdjs/ucd/commit/cb28a42eca70bbcdaf2a8d3425721de7bef21bf9))
* fix(fs-bridge): set default type for TOptionsSchema in defineFileSystemBridge ([a37a81c2](https://github.com/ucdjs/ucd/commit/a37a81c2b5c0adc5c130312fce50a6e1697f0713))
* fix(fs-bridge): improve error handling during bridge setup ([efad5a3a](https://github.com/ucdjs/ucd/commit/efad5a3a4d5bfabeb7fd83e27bd7eebc57b07aa4))
* fix(fs-bridge): enhance error handling with PathUtilsBaseError ([87bb2163](https://github.com/ucdjs/ucd/commit/87bb21639252ed895ec3e67f8a158911bb4339be))
* fix(fs-bridge): improve proxy method handling in defineFileSystemBridge ([93bc2610](https://github.com/ucdjs/ucd/commit/93bc2610e0aab663000c3bd26f54d615cf6a2d77))
* fix(fs-bridge): refine error handling and type assertions in proxy methods ([b93ae49e](https://github.com/ucdjs/ucd/commit/b93ae49e7d413efb1d74ef94f21360ed36619f9a))
* fix(fs-bridge): enhance error handling for promise operations ([9c054b6f](https://github.com/ucdjs/ucd/commit/9c054b6f51cf6a3c633855ac1fa9740f14a35af8))
* fix(fs-bridge): refine constructor for BridgeBaseError and remove duplicate class definition ([1147df55](https://github.com/ucdjs/ucd/commit/1147df55c2546866e3230dcdbdc949c469bba937))
* fix(fs-bridge): refine type assertion for original method in proxy ([b7c733dd](https://github.com/ucdjs/ucd/commit/b7c733dd6ed1ac420d80273e275125e1e19955d2))
* fix(fs-bridge): refine type assertion for original method in proxy ([13043af5](https://github.com/ucdjs/ucd/commit/13043af591eb21cbac1999a6d12768da3daad81a))
* fix(fs-bridge): improve error handling in proxy methods ([798c9cb4](https://github.com/ucdjs/ucd/commit/798c9cb4ec34b25f9f416af1e8bf0f53d5fc2686))
* fix(fs-bridge): ensure original method context is preserved in proxy ([e0453470](https://github.com/ucdjs/ucd/commit/e0453470288b7d998a3254b814f04a0eed786502))
* fix(ucd-store): improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf))
* fix(fs-bridge): improve error handling for HEAD requests ([261cf461](https://github.com/ucdjs/ucd/commit/261cf4611edc6bc2fc981e4521684e0c530d8262))
* fix(fs-bridge): improve error handling for invalid URL encoding in path resolution ([a5ef25cf](https://github.com/ucdjs/ucd/commit/a5ef25cff9ddc98b2c7bf55c9ae324ba6668f115))
* fix(fs-bridge): improve error messaging for dangerous control characters in path resolution ([98dd1c02](https://github.com/ucdjs/ucd/commit/98dd1c023dd428a9ddbe3e45517d776b0ab99bdf))
* fix(fs-bridge): enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256))

### Miscellaneous

* chore(release): 📦 version packages ([d592b87c](https://github.com/ucdjs/ucd/commit/d592b87c3363761635c4085ffa747b84e8173b85))
* test(fs-bridge): refactor and enhance tests for `defineFileSystemBridge` ([ac64ba61](https://github.com/ucdjs/ucd/commit/ac64ba6148643db67c26d1f030d239282a23a4a3))
* test(fs-bridge): add tests for `getPayloadForHook` utility function ([c076b7b1](https://github.com/ucdjs/ucd/commit/c076b7b1cc1c1c461cb53d60850ea84d68336dc1))
* test(fs-bridge): refactor before hook tests for clarity and consistency ([cbb62ce9](https://github.com/ucdjs/ucd/commit/cbb62ce93503a5ff3827c3ca4942719bf50fcb74))
* test(fs-bridge): refactor capability tests and enhance detection logic ([edf2197d](https://github.com/ucdjs/ucd/commit/edf2197df1e86042d31a1a67428147ee68c2da7b))
* refactor(fs-bridge): refactor file system bridge operations and introduce operation wrappers ([b0db2a05](https://github.com/ucdjs/ucd/commit/b0db2a052d26bb21a88a18d202b72f367397b7af))
* refactor: rename `.on` to `.hook` (#377) ([#377](https://github.com/ucdjs/ucd/issues/377)) ([2a444735](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2))
* chore: update pnpm ([62648fcd](https://github.com/ucdjs/ucd/commit/62648fcdc77588623a0e55b7dd0e223728d3e31d))
* test(fs-bridge): update unsupported operation tests to handle async errors ([c25d1f35](https://github.com/ucdjs/ucd/commit/c25d1f35cfdd96ec6d1317ec88bd3807722ed611))
* test(fs-bridge): make error hooks handle async operations correctly ([8ad66327](https://github.com/ucdjs/ucd/commit/8ad6632713cbcaeeeb01ba0ee6abddc9844299b2))
* chore(fs-bridge): replace `hooxs` with `hookable` in package dependencies ([d003911e](https://github.com/ucdjs/ucd/commit/d003911e67b77722b2df8ad6edb24a302c72783d))
* chore: fix typo ([cf592dd8](https://github.com/ucdjs/ucd/commit/cf592dd8263866c77b6e3ca2a38cbaef7b008b18))
* test(fs-bridge): add comprehensive tests for hook functionality ([7fc7c663](https://github.com/ucdjs/ucd/commit/7fc7c663d54d871bac75e7f366340ecd9cf1e307))
* chore: add hooxs dependency to package.json and pnpm-workspace.yaml ([5e69481e](https://github.com/ucdjs/ucd/commit/5e69481e9f40f1a93ab20304e8c5ad859be89fbe))
* chore: update pnpm ([7e789f64](https://github.com/ucdjs/ucd/commit/7e789f64e1ec75302bf973cee44f0aaf20347f66))
* test(fs-bridge): correct meta structure in SimpleBridge definition ([1f79d6d0](https://github.com/ucdjs/ucd/commit/1f79d6d08604fa5dbc9e20e40d068a2204d9216f))
* test(fs-bridge): update capability handling in tests ([383efdaa](https://github.com/ucdjs/ucd/commit/383efdaab167ae913c886dde63a887112b99b8fd))
* test(fs-bridge): clean up capability assertions and improve error handling ([1bb30fe8](https://github.com/ucdjs/ucd/commit/1bb30fe884cff013e5f38ab2a1edb060ade8c1b6))
* test(fs-bridge): enhance type definitions and setup structure ([02b5c3cc](https://github.com/ucdjs/ucd/commit/02b5c3ccb97718e1ae02dcf343025fd563af0cbd))
* test(fs-bridge): simplify capability assertions in tests ([5bef390d](https://github.com/ucdjs/ucd/commit/5bef390d09aa3bfb744af4670e266c7afcaa84ab))
* test(fs-bridge): remove unnecessary capability assertions in tests ([d33da97f](https://github.com/ucdjs/ucd/commit/d33da97fac53b7476d143d4b7c4d114861dc5e91))
* refactor(fs-bridge): update capability types to use `OptionalCapabilityKey` ([956d8301](https://github.com/ucdjs/ucd/commit/956d8301a592b01be5dbb239738cb3b2bf3d3134))
* refactor(fs-bridge): enhance capability handling in file system bridge ([5e5bf2f1](https://github.com/ucdjs/ucd/commit/5e5bf2f11eef8ccc102c5c39313aa505c0b861ea))
* chore: lint ([6c637763](https://github.com/ucdjs/ucd/commit/6c637763f3abaa7671dca74e99298d7791d1de3b))
* chore: fix docs ([0056a283](https://github.com/ucdjs/ucd/commit/0056a28371e2fa423d97b6bfdb9a2c0aad292017))
* chore: fix typo ([5e12d7fa](https://github.com/ucdjs/ucd/commit/5e12d7faa43819ddbfc1fa22e07b44a5beac5810))
* refactor(fs-bridge): improve bridge capabilities handling ([680b2ddb](https://github.com/ucdjs/ucd/commit/680b2ddbb59c808ae44a10447cd6fabc0280c39f))
* chore: lint ([2a47d579](https://github.com/ucdjs/ucd/commit/2a47d579d79aaa8acd59b251f9c537d07c6c8e85))
* refactor(fs-bridge): prefer for bridge capability change ([0a9500e4](https://github.com/ucdjs/ucd/commit/0a9500e4f2f98f89bd4ebfbfae377693c5eccc0c))
* test(fs-bridge): update state handling in `defineFileSystemBridge` ([98898102](https://github.com/ucdjs/ucd/commit/98898102f3d7bba51e31edf45c6f17a8fdc6d567))
* refactor(fs-bridge): rename `metadata` to `meta` in bridge definitions ([1dd5e3f1](https://github.com/ucdjs/ucd/commit/1dd5e3f1d4d46290be8a051005fce145426feb22))
* test(fs-bridge): update bridge definition to use metadata structure ([07b5ac37](https://github.com/ucdjs/ucd/commit/07b5ac3784c75eb0e17e25e33a208134c35abb61))
* refactor(fs-bridge): update metadata structure for HTTP and Node.js bridges ([20994031](https://github.com/ucdjs/ucd/commit/209940314ef9b0f0aba641386d690ceb801d1fe5))
* refactor(fs-bridge): enhance FileSystemBridge metadata structure ([083d923b](https://github.com/ucdjs/ucd/commit/083d923b44c587b245eed54f3a8e59bf3f789d20))
* chore: lint ([ea61d4f7](https://github.com/ucdjs/ucd/commit/ea61d4f73234c7bec95501820a886a38b97d205b))
* chore(tests): update import paths for test utilities ([05725fc0](https://github.com/ucdjs/ucd/commit/05725fc0b3687ea717ee589fd71faf403e31727e))
* chore: update docs ([78130b2f](https://github.com/ucdjs/ucd/commit/78130b2fcf729965ca87e563c621b20cfbc47be7))
* chore: fix doc ([32300642](https://github.com/ucdjs/ucd/commit/323006429a321d52a4f7a4a9d19653652b3a51c9))
* test(fs-bridge): add descriptive names and descriptions to mock bridges in tests ([691bf4ec](https://github.com/ucdjs/ucd/commit/691bf4ecf995d54cc0abeb176d145a38a168a94d))
* test(fs-bridge): add type inference tests for defineFileSystemBridge ([b9ad0be9](https://github.com/ucdjs/ucd/commit/b9ad0be9fe537301ab50020da6f99096d740b1e2))
* chore: lint ([8469508a](https://github.com/ucdjs/ucd/commit/8469508aec673305a09ff58adc6dedab1e50bc1e))
* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* chore: update dependencies ([bf3b20f8](https://github.com/ucdjs/ucd/commit/bf3b20f833acb2b7ba141cba90ce66b0bfb609ab))
* chore: update packageManager to pnpm@10.16.1 across all packages ([ec4ebd9d](https://github.com/ucdjs/ucd/commit/ec4ebd9d87af120224be62725ef47bd09199912b))
* chore: update package versions in pnpm-workspace.yaml to remove caret (^) for consistency ([8521f03a](https://github.com/ucdjs/ucd/commit/8521f03a9f4e7cf992892575bcf7f925cc42c9b6))
* chore: use node 22.18 ([2a9bfcd7](https://github.com/ucdjs/ucd/commit/2a9bfcd72958446e28490fc042cfbb81889cd73b))
* chore(fs-bridge): add @ucdjs/shared as a workspace dependency ([804f7d36](https://github.com/ucdjs/ucd/commit/804f7d368dc9ba8bbd27148b8ead6b5abbb05734))
* chore: remove unused test file ([02d5dec4](https://github.com/ucdjs/ucd/commit/02d5dec403a65e650e61e40e1225303af6e09840))
* refactor(fs-bridge): explicitly export error classes from errors module ([4d3088c1](https://github.com/ucdjs/ucd/commit/4d3088c1be33d07264f353173cfa2b898a7e526f))
* test(fs-bridge): enhance tests for filesystem bridge operations ([d093e8f1](https://github.com/ucdjs/ucd/commit/d093e8f19a6cc822bf632df52e9fe2f28ac1148c))
* refactor(fs-bridge): remove unused utility functions and clean up imports ([a0bb2569](https://github.com/ucdjs/ucd/commit/a0bb2569bdf506866b6bd86a7fe1cc7e2915c827))
* chore: add path utils dependency ([cd2fd914](https://github.com/ucdjs/ucd/commit/cd2fd9147680f798f124b5df14dadb65f01787ac))
* refactor(path-utils): swap parameters for consistency ([2264cfa4](https://github.com/ucdjs/ucd/commit/2264cfa423e235ce6191ad58823d14439bf1dada))
* chore: add missing exports ([ceeda325](https://github.com/ucdjs/ucd/commit/ceeda32544595cfe3eb2f2e45487ea400f1deb1b))
* chore: format ([6eb37244](https://github.com/ucdjs/ucd/commit/6eb37244f52dbabe100d46a9af0bcccb889c5243))
* Merge remote-tracking branch 'origin/main' into bridge-try-catch ([c1682e3e](https://github.com/ucdjs/ucd/commit/c1682e3e2281d2baa131b47e6187e38b363e223a))
* test(fs-bridge): update listdir test to use expect.arrayContaining ([199d80bf](https://github.com/ucdjs/ucd/commit/199d80bf55b3949886aee40cb301911a93124622))
* chore: fix test ([ee074293](https://github.com/ucdjs/ucd/commit/ee0742936ea7b8a98df98d37d1fc62eb15a0ce91))
* refactor(fs-bridge): update `zod` version to 4.1.5 ([68ff4595](https://github.com/ucdjs/ucd/commit/68ff459549f4e59ac80c1f6365fe1ac6c58f9dd1))
* refactor(fs-bridge): replace error message in `resolveSafePath` with `BridgePathTraversal` ([b2e9db55](https://github.com/ucdjs/ucd/commit/b2e9db55382a7f2e54a2795ea144314d5b5b73a8))
* refactor(fs-bridge): rename `path` to `accessedPath` in `BridgePathTraversal` error class ([edca2a2f](https://github.com/ucdjs/ucd/commit/edca2a2f626a2ca3164a57cd57defa8a04b317db))
* refactor(fs-bridge): update `baseUrl` schema and enhance path resolution ([9fc6f14a](https://github.com/ucdjs/ucd/commit/9fc6f14acc65aef56825e32e8d46d029d0b17b58))
* refactor(fs-bridge): remove `resolveSafePath` and `isWithinBase` functions ([8f7080dd](https://github.com/ucdjs/ucd/commit/8f7080dd48bcf3603ee9261829bc5e5b9e9ccd72))
* chore: add `pathe` dependency ([4b421d39](https://github.com/ucdjs/ucd/commit/4b421d39e9d5e2921c7f5e7256860724499cd71e))
* refactor(fs-bridge): enhance error handling in proxy methods ([1ea29cf8](https://github.com/ucdjs/ucd/commit/1ea29cf8510917f5d24e6355e7da06f935718cb8))
* chore: format ([76cab427](https://github.com/ucdjs/ucd/commit/76cab4278dec735fb926e84035034e40e77c0fd0))
* refactor(fs-bridge): consolidate error classes under BridgeBaseError ([7151e5b7](https://github.com/ucdjs/ucd/commit/7151e5b75ab4b813f0e0427574909d2b72632826))
* refactor(fs-bridge): add additional error classes for better error handling ([52c9ffc0](https://github.com/ucdjs/ucd/commit/52c9ffc042fce9edfd4f31dc15318cf8287c12ae))
* refactor(fs-bridge): move BridgeUnsupportedOperation to a new errors module ([65ac0554](https://github.com/ucdjs/ucd/commit/65ac0554f6488a4868fbca945fd65d179b07c130))
* refactor: migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa))
* chore: migrate test-utils-internal to internal alias ([2cd82c0d](https://github.com/ucdjs/ucd/commit/2cd82c0d2c052572349a85946aca560b7bb8b212))
* chore: fix imports ([162de26f](https://github.com/ucdjs/ucd/commit/162de26f4a95f541359e8e6cd5a997c597398e6f))
* chore: update pnpm workspace and add test utils package ([80e2d592](https://github.com/ucdjs/ucd/commit/80e2d5920f851ea557ab45fdfa31c6a7d9d095ac))
* chore: refactor imports to use #test-utils for consistency ([280d8ea9](https://github.com/ucdjs/ucd/commit/280d8ea965d959addf41a43d20fe3918189326cd))
* chore: clean up imports in node and store modules ([8b4e6ffe](https://github.com/ucdjs/ucd/commit/8b4e6ffe3f1609b5632460dd3c6d2b0211b7cf8f))
* chore: update file paths in tests and implementation ([217e3add](https://github.com/ucdjs/ucd/commit/217e3addfcc0a5a6351091ea67fbe895a06212fb))
* chore: fix typecheck ([79eed51d](https://github.com/ucdjs/ucd/commit/79eed51de72cd83395ac3b2563029940eb7934ce))
* refactor(fs-bridge): add internal documentation for capability inference function ([1dfe4c89](https://github.com/ucdjs/ucd/commit/1dfe4c890de994cee6b76e84de7c82bef8dd70e1))
* refactor(fs-bridge): enhance capability assertion with custom error handling ([91d1ee9f](https://github.com/ucdjs/ucd/commit/91d1ee9f33cf03ee212af7a1f3bf8f0993f2302b))
* refactor(fs-bridge): remove capabilities from bridge definition ([443e582f](https://github.com/ucdjs/ucd/commit/443e582f4ab7fb947033b3a35e0bc3fe4c03a816))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* refactor(ucd-store): update FileSystemBridge integration and capabilities handling ([c2f7e5d3](https://github.com/ucdjs/ucd/commit/c2f7e5d3d05170bd6a83697572b2f454a6d86dcb))
* refactor(fs-bridge): enhance FileSystemBridge capabilities and update type definitions ([be7b3939](https://github.com/ucdjs/ucd/commit/be7b39397991aab6b855768c8026bd788388cdee))
* chore(fs-bridge): remove internal debug symbol and references ([e83fd989](https://github.com/ucdjs/ucd/commit/e83fd989f3a056c371b48b77c5e3980219a22df9))
* chore: fix test ([51a64936](https://github.com/ucdjs/ucd/commit/51a64936556a9a8d684261bc235e76b683ff8888))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* chore(eslint): update `@luxass/eslint-config` to version 5.2.1 ([28c3338f](https://github.com/ucdjs/ucd/commit/28c3338fbe59474a2dca4f65e21598a5fece83e2))
* refactor(store): improve file path handling and analysis logic ([3d586c5b](https://github.com/ucdjs/ucd/commit/3d586c5b14d8f0e49c4fc107a0a4fb4f674ba239))
* chore: lint ([8a493ed9](https://github.com/ucdjs/ucd/commit/8a493ed93181d340c9afadfb1fbe08a6c6dadd48))
* chore(eslint): refactor ESLint configuration across multiple packages ([4924a4c8](https://github.com/ucdjs/ucd/commit/4924a4c8d1d1296fa6717b278e695d05450b2f5a))
* chore: remove debug log ([dde92d63](https://github.com/ucdjs/ucd/commit/dde92d63e819582cb6368a0e5abef2655410a7e7))
* chore(fs-bridge): remove debug logging from exists method ([b2c655a1](https://github.com/ucdjs/ucd/commit/b2c655a170bccb1bad1f1957ca4001b7de23633b))
* Merge remote-tracking branch 'origin/main' into store ([dfc880dd](https://github.com/ucdjs/ucd/commit/dfc880dd94e58804d8ebefc0a388b51b25d2d5aa))
* test(fs-bridge): enhance path resolution tests and add absolute path handling ([468bb64b](https://github.com/ucdjs/ucd/commit/468bb64b01e81293643b818f31562e0d3e1b6a3d))
* refactor(fs-bridge): streamline path resolution and safety checks ([340eb3e1](https://github.com/ucdjs/ucd/commit/340eb3e164ef4d069ddfb224513feb562b0fc16a))
* Merge branch 'main' into store ([06b7fdcc](https://github.com/ucdjs/ucd/commit/06b7fdccacdec1c89b58bb09c44c016dc08ea752))
* test(fs-bridge): disable tests for critical system paths due to traversal attack checks ([e3411c12](https://github.com/ucdjs/ucd/commit/e3411c12faee5c75b64736ae084e9580e8ddebdc))
* test(fs-bridge): enhance security tests for path validation ([b58cbbab](https://github.com/ucdjs/ucd/commit/b58cbbab616b7d1c1b0189060d38db7b30ee1200))
* chore: update pkg json ([e705265a](https://github.com/ucdjs/ucd/commit/e705265adb0bca7547eec5868552a6c46a71ef03))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore(fs-bridge): clarify comments for read-only methods ([50941eec](https://github.com/ucdjs/ucd/commit/50941eeccd0f1bf41023b7de17e24c73eceeef11))
* chore: update import statements for consistency ([c2e24246](https://github.com/ucdjs/ucd/commit/c2e24246c2814725a4a27a7bf78671f4b89e677f))


## 0.1.0

### Minor Changes

- [#181](https://github.com/ucdjs/ucd/pull/181) [`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4) Thanks [@luxass](https://github.com/luxass)! - Reimplement the Node.js File System Bridge with enhanced path handling and safety checks.

- [#189](https://github.com/ucdjs/ucd/pull/189) [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39) Thanks [@luxass](https://github.com/luxass)! - add `BridgeUnsupportedOperation` error

- [#241](https://github.com/ucdjs/ucd/pull/241) [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119) Thanks [@luxass](https://github.com/luxass)! - Migrate fs-bridge to use the new @ucdjs/path-utils package for improved path handling and safety.

  This change removes the local path utility functions and leverages the centralized path-utils package instead:

  **Before:**

  ```ts
  import { resolveSafePath } from "./utils";
  // Local BridgePathTraversal error class
  ```

  **After:**

  ```ts
  import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
  // Uses centralized path utilities and error handling
  ```

  **Key changes:**

  - Removed local `utils.ts` file with `resolveSafePath` and `isWithinBase` functions
  - Added `@ucdjs/path-utils` as a dependency
  - Updated imports to use the centralized path utilities
  - Removed `BridgePathTraversal` error class in favor of path-utils error handling
  - Enhanced error handling to catch `PathUtilsBaseError` instances
  - Added `BridgeSetupError` for better error handling during bridge setup

- [#212](https://github.com/ucdjs/ucd/pull/212) [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35) Thanks [@luxass](https://github.com/luxass)! - feat: migrate from @ucdjs/utils to @ucdjs-internal/shared

  Updated internal imports to use `@ucdjs-internal/shared` instead of `@ucdjs/utils` for utilities like `safeJsonParse` and other shared patterns. This aligns with the new package structure where `@ucdjs-internal/shared` contains internal utilities and `@ucdjs/utils` focuses on public-facing utilities.

- [#228](https://github.com/ucdjs/ucd/pull/228) [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d) Thanks [@luxass](https://github.com/luxass)! - feat: add custom fs-bridge errors

  Adds four new custom error classes for better error handling in the fs-bridge:

  - `BridgeGenericError`: For wrapping unexpected errors with optional original error reference
  - `BridgePathTraversal`: For path traversal security violations when accessing files outside allowed scope
  - `BridgeFileNotFound`: For file or directory not found errors
  - `BridgeEntryIsDir`: For cases where a file is expected but a directory is found

  ```typescript
  import { BridgeFileNotFound, BridgePathTraversal } from "@ucdjs/fs-bridge";

  // Example usage in bridge implementations
  try {
    await fsp.readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new BridgeFileNotFound(path);
    }
    throw new BridgeGenericError("Unexpected file system error", error);
  }
  ```

- [#69](https://github.com/ucdjs/ucd/pull/69) [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec) Thanks [@luxass](https://github.com/luxass)! - feat: add fs-bridge module with Node.js, HTTP, and default export variants

  The fs-bridge is now available via three import paths:

  - `@ucdjs/fs-bridge/bridges/node` (Node.js version)
  - `@ucdjs/fs-bridge/bridges/http` (HTTP version)
  - `@ucdjs/fs-bridge` (default version)

- [#306](https://github.com/ucdjs/ucd/pull/306) [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3) Thanks [@luxass](https://github.com/luxass)! - Add support for metadata on fs-bridges

- [#341](https://github.com/ucdjs/ucd/pull/341) [`7d98e29`](https://github.com/ucdjs/ucd/commit/7d98e29af2f9f6d681f9f2ee401baddf5a2c6ef6) Thanks [@luxass](https://github.com/luxass)! - Refactored file system bridge metadata structure to simplify the API and improve consistency.

  **Breaking Changes:**

  - Renamed `metadata` property to `meta`
  - Moved `name` and `description` from top-level properties into the `meta` object
  - The `meta` property is now required instead of optional
  - Removed `persistent` and `mirror` properties from old `metadata` object
  - Removed support for custom metadata fields

  **Before:**

  ```ts
  const MyBridge = defineFileSystemBridge({
    name: "My Bridge",
    description: "A file system bridge",
    metadata: {
      persistent: true,
    },
    setup: () => ({
      /* operations */
    }),
  });
  ```

  **After:**

  ```ts
  const MyBridge = defineFileSystemBridge({
    meta: {
      name: "My Bridge",
      description: "A file system bridge",
    },
    setup: () => ({
      /* operations */
    }),
  });
  ```

  This change consolidates all descriptive information into the `meta` object, making the bridge definition cleaner and more predictable.

- [#377](https://github.com/ucdjs/ucd/pull/377) [`2a44473`](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2) Thanks [@luxass](https://github.com/luxass)! - Renamed `on` method to `hook` for event handling in FileSystemBridge.

  **Breaking Change:**

  The event handling method has been renamed from `on` to `hook` for improved clarity and consistency with the underlying `hookable` library.

  **Before:**

  ```ts
  import { createFileSystemBridge } from "@ucdjs/fs-bridge";

  const bridge = createFileSystemBridge(/* ... */);

  bridge.on("read:before", ({ path }) => {
    console.log(`Reading file: ${path}`);
  });

  bridge.on("error", ({ method, path, error }) => {
    console.error(`Error in ${method} at ${path}:`, error);
  });
  ```

  **After:**

  ```ts
  import { createFileSystemBridge } from "@ucdjs/fs-bridge";

  const bridge = createFileSystemBridge(/* ... */);

  bridge.hook("read:before", ({ path }) => {
    console.log(`Reading file: ${path}`);
  });

  bridge.hook("error", ({ method, path, error }) => {
    console.error(`Error in ${method} at ${path}:`, error);
  });
  ```

  **Migration:**

  Simply replace all instances of `.on(` with `.hook(` when working with FileSystemBridge instances. The hook signatures and payloads remain unchanged.

- [#351](https://github.com/ucdjs/ucd/pull/351) [`4fd46b4`](https://github.com/ucdjs/ucd/commit/4fd46b43613b23c1d120c71ae0754883eb9bf1ff) Thanks [@luxass](https://github.com/luxass)! - Add universal hooks system for file system bridge operations

  File system bridges now support hooks for observing and intercepting operations:

  **Hook Types:**

  - `error` - Called when any operation throws an error (including unsupported operations)
  - `{operation}:before` - Called before an operation executes (e.g., `read:before`, `write:before`)
  - `{operation}:after` - Called after an operation succeeds (e.g., `read:after`, `write:after`)

  **Supported Operations:**

  - `read`, `write`, `listdir`, `exists`, `mkdir`, `rm`

  **Usage Example:**

  ```typescript
  import { createNodeBridge } from "@ucdjs/fs-bridge";

  const bridge = createNodeBridge({ basePath: "./data" });

  // Register hooks
  bridge.on("read:before", ({ path }) => {
    console.log(`Reading: ${path}`);
  });

  bridge.on("read:after", ({ path, content }) => {
    console.log(`Read ${content.length} bytes from ${path}`);
  });

  bridge.on("error", ({ method, path, error }) => {
    console.error(`${method} failed on ${path}:`, error);
  });
  ```

  **Exported Types:**

  - `FileSystemBridgeHooks` - Main hooks interface

  This enables use cases like logging, metrics, caching, testing, and auditing across all bridge implementations (Node, HTTP, Memory).

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

- [#189](https://github.com/ucdjs/ucd/pull/189) [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b) Thanks [@luxass](https://github.com/luxass)! - rewrite fs-bridge capabilities

- [#175](https://github.com/ucdjs/ucd/pull/175) [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3) Thanks [@luxass](https://github.com/luxass)! - feat: handle security in node filesystem bridge

  This will disallow path traversal attacks and prevent access to critical system paths.

- [#160](https://github.com/ucdjs/ucd/pull/160) [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f) Thanks [@luxass](https://github.com/luxass)! - feat!: migrate fs-bridge from utils to fs-bridge package

- [#187](https://github.com/ucdjs/ucd/pull/187) [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61) Thanks [@luxass](https://github.com/luxass)! - refactor capability code

- [#230](https://github.com/ucdjs/ucd/pull/230) [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234) Thanks [@luxass](https://github.com/luxass)! - feat: add path traversal utilities to bridge setup context

  Adds shared utility functions to the bridge setup context for consistent path security:

  - **`resolveSafePath(basePath, inputPath)`**: Safely resolves paths while preventing traversal attacks
  - **`isWithinBase(resolvedPath, basePath)`**: Checks if a path is within an allowed base directory

  Both utilities work for file system paths (Node bridge) and URL paths (HTTP bridge) by treating URL pathnames as base paths.

  ```typescript
  import { defineFileSystemBridge } from "@ucdjs/fs-bridge";

  const bridge = defineFileSystemBridge({
    optionsSchema: z.object({ basePath: z.string() }),
    setup({ options, resolveSafePath }) {
      const basePath = resolve(options.basePath);

      return {
        async read(path) {
          // Automatically prevents path traversal - throws BridgePathTraversal if unsafe
          const safePath = resolveSafePath(basePath, path);
          return readFile(safePath);
        },
      };
    },
  });

  // For HTTP bridges, URL pathname is used as base path:
  const httpBridge = defineFileSystemBridge({
    setup({ options, resolveSafePath }) {
      const baseUrl = new URL(options.baseUrl);
      const basePath = baseUrl.pathname; // e.g., "/api/v1/files"

      return {
        async read(path) {
          // Prevents escaping API endpoint: "../admin" → BridgePathTraversal
          const safePath = resolveSafePath(basePath, path);
          const url = new URL(safePath, baseUrl.origin);
          return fetch(url).then((r) => r.text());
        },
      };
    },
  });
  ```

### Patch Changes

- [#301](https://github.com/ucdjs/ucd/pull/301) [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69) Thanks [@luxass](https://github.com/luxass)! - infer bridge option schema as never, if not provided

- [#332](https://github.com/ucdjs/ucd/pull/332) [`ce9b5a7`](https://github.com/ucdjs/ucd/commit/ce9b5a76795292aca5c9f8b6fd7021a66a34c28d) Thanks [@luxass](https://github.com/luxass)! - export `FileSystemBridgeFactory` in @ucdjs/fs-bridge

- [#341](https://github.com/ucdjs/ucd/pull/341) [`46a6e81`](https://github.com/ucdjs/ucd/commit/46a6e8110dcc1ccef3a436bb18e67d92f0424213) Thanks [@luxass](https://github.com/luxass)! - Rename `capabilities` to `optionalCapabilities` in bridge configuration

- [#341](https://github.com/ucdjs/ucd/pull/341) [`39faaf5`](https://github.com/ucdjs/ucd/commit/39faaf585f3339296ef75c8a39893399ea48789f) Thanks [@luxass](https://github.com/luxass)! - Add `hasCapability` guard for checking bridge capabilities without throwing

- [#343](https://github.com/ucdjs/ucd/pull/343) [`170bbd1`](https://github.com/ucdjs/ucd/commit/170bbd1a8cfe23787d73e1052108261bb5956d01) Thanks [@luxass](https://github.com/luxass)! - Separate required and optional file system operations

  File system bridge operations are now split into two interfaces:

  - `RequiredFileSystemBridgeOperations`: Core read-only operations (`read`, `listdir`, `exists`) that all bridges must implement
  - `OptionalFileSystemBridgeOperations`: Write operations (`write`, `mkdir`, `rm`) that bridges can optionally support

  The `optionalCapabilities` map now only tracks optional operations, as required operations are guaranteed to exist. Capability types have been updated to `RequiredCapabilityKey` and `OptionalCapabilityKey` for better type safety.

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`e612985`](https://github.com/ucdjs/ucd/commit/e612985209ff4e62fbfba418621a029d000b4b01), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640), [`2d8f1b9`](https://github.com/ucdjs/ucd/commit/2d8f1b90f453b95c0cd4ac95aec67e028fc74e03)]:
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/path-utils@0.1.0
  - @ucdjs/schemas@0.1.0
