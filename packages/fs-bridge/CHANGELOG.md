# @ucdjs/fs-bridge

## [0.1.1-beta.7](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.6...@ucdjs/fs-bridge@0.1.1-beta.7) (2026-02-27)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.6...@ucdjs/fs-bridge@0.1.1-beta.7)


## [0.1.1-beta.6](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.5...@ucdjs/fs-bridge@0.1.1-beta.6) (2026-02-19)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.5...@ucdjs/fs-bridge@0.1.1-beta.6)


## [0.1.1-beta.5](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.4...@ucdjs/fs-bridge@0.1.1-beta.5) (2026-02-16)




### Notes

* No significant commits in this release.


## [0.1.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.3...@ucdjs/fs-bridge@0.1.1-beta.4) (2026-02-15)




### Notes

* No significant commits in this release.


## [0.1.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.2...@ucdjs/fs-bridge@0.1.1-beta.2) (2026-02-15)


### 🚀 Features
* add path validation for listdir tests ([b3df8a65](https://github.com/ucdjs/ucd/commit/b3df8a6540495322e26021763ca5f42f295e13d7)) (by [@luxass](https://github.com/luxass))
* format paths with leading and trailing slashes ([df9b301f](https://github.com/ucdjs/ucd/commit/df9b301f1e1c1ab3a00e20a385c5468486ece95a)) (by [@luxass](https://github.com/luxass))
* add symbol support for HTTP bridge definition ([1c3664e8](https://github.com/ucdjs/ucd/commit/1c3664e84e593f0a13d74227e18b60d50e892af3)) (by [@luxass](https://github.com/luxass))
* add detailed documentation for listdir method ([22ecdde9](https://github.com/ucdjs/ucd/commit/22ecdde986bd1214a44db3bb7a5feac116a5058c)) (by [@luxass](https://github.com/luxass))
* add node and http playground scripts ([eda5a23a](https://github.com/ucdjs/ucd/commit/eda5a23a95fcb7443db5da84ebeff64921efe1b0)) (by [@luxass](https://github.com/luxass))
* add isBuiltinHttpBridge function and update exports ([264723a6](https://github.com/ucdjs/ucd/commit/264723a61c72fda87cdc868ab043745b8a28cd8e)) (by [@luxass](https://github.com/luxass))
* add custom error matcher and update Vitest setup ([647a592b](https://github.com/ucdjs/ucd/commit/647a592bcbfc82eade3559df3113f9f4c8707745)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* complete security tests for fs-bridge path resolution ([e35cd457](https://github.com/ucdjs/ucd/commit/e35cd4572b56e4c5d7845984b2c0cea724fa0478)) (by [@luxass](https://github.com/luxass))
* implement comprehensive HTTP bridge security tests ([c8b13e05](https://github.com/ucdjs/ucd/commit/c8b13e0552ca9881bbc84f67b75f40acf67ccfa6)) (by [@luxass](https://github.com/luxass))
* add utility functions for hook payload construction and operation wrapping ([f90f3b87](https://github.com/ucdjs/ucd/commit/f90f3b873044aaecac01aa96df13b2adc58582be)) (by [@luxass](https://github.com/luxass))
* upgrade hookable ([PR #378](https://github.com/ucdjs/ucd/pull/378)) ([4591756b](https://github.com/ucdjs/ucd/commit/4591756bac443dd4b2a7c1c7e0f66e4d69edb11b)) (by [@luxass](https://github.com/luxass))
* add `encoding` property to hook payload for `write:before` ([c5de8fbe](https://github.com/ucdjs/ucd/commit/c5de8fbeba60bb699bfd5443dade1c3abcf0bfee)) (by [@luxass](https://github.com/luxass))
* enhance hook payload types and improve type safety ([677ab0e2](https://github.com/ucdjs/ucd/commit/677ab0e27ef74a5842cf3655ff8d9dbefc06ff5c)) (by [@luxass](https://github.com/luxass))
* enhance `rm` operation payload and update hook signatures ([6ef1d6d2](https://github.com/ucdjs/ucd/commit/6ef1d6d2d98de13706656a77b987f0677a373498)) (by [@luxass](https://github.com/luxass))
* define supported bridge operations ([4a2df972](https://github.com/ucdjs/ucd/commit/4a2df97258d9e551ba5768756e6ce2ac39cd826f)) (by [@luxass](https://github.com/luxass))
* integrate hooks for file system operations ([9e8dbe64](https://github.com/ucdjs/ucd/commit/9e8dbe6444a291ee7f590ca63468d0567cbd14c5)) (by [@luxass](https://github.com/luxass))
* add `hasCapability` function to guard bridge capabilities ([7df47eb7](https://github.com/ucdjs/ucd/commit/7df47eb7d4a8f71f533dece8eb451b4bbb241456)) (by [@luxass](https://github.com/luxass))
* add FileSystemBridgeFactory type export ([8d42c7f9](https://github.com/ucdjs/ucd/commit/8d42c7f9165b6c11cd84b26f9bb04b77251ec0f0)) (by [@luxass](https://github.com/luxass))
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* add support for data mirroring in FileSystemBridgeMetadata ([f5df4435](https://github.com/ucdjs/ucd/commit/f5df4435bdaeb482eec7821d05bbc4c9a44fa55a)) (by [@luxass](https://github.com/luxass))
* make metadata optional in FileSystemBridge interfaces ([9f202d0a](https://github.com/ucdjs/ucd/commit/9f202d0a5795cf1a19ddf9be61ce4bb926b72afd)) (by [@luxass](https://github.com/luxass))
* add metadata and descriptive fields to HTTP and Node.js bridges ([7bf84348](https://github.com/ucdjs/ucd/commit/7bf84348f754296579d7965fc65e8a58aee09c04)) (by [@luxass](https://github.com/luxass))
* enhance FileSystemBridge with metadata and descriptive fields ([a35231e3](https://github.com/ucdjs/ucd/commit/a35231e30985f277af04a005380923a49e90ef42)) (by [@luxass](https://github.com/luxass))
* add BridgeSetupError class for enhanced error handling ([473b7255](https://github.com/ucdjs/ucd/commit/473b7255bfc71e33547c9b95cb68f6dfffb3aa04)) (by [@luxass](https://github.com/luxass))
* integrate `resolveSafePath` into file system bridge setup ([5cadac4d](https://github.com/ucdjs/ucd/commit/5cadac4df129cace5b6c4ded1b760853eed5c646)) (by [@luxass](https://github.com/luxass))
* add path resolution functions for security ([c9ff1916](https://github.com/ucdjs/ucd/commit/c9ff19164fb0d352ad18e6fa24fd72c49a28d9d2)) (by [@luxass](https://github.com/luxass))
* update TypeScript configuration and add tsconfig dependency ([fcd13059](https://github.com/ucdjs/ucd/commit/fcd13059257d336b31620a5fd64fc2cdff0192e9)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* support Uint8Array ([2f554138](https://github.com/ucdjs/ucd/commit/2f554138b55bd5e0624071f0798e5f40ef6cb651)) (by [@luxass](https://github.com/luxass))
* implement capability assertion and error handling ([43ef6402](https://github.com/ucdjs/ucd/commit/43ef6402e9e539353fc20adb9ca6b7c3389b9767)) (by [@luxass](https://github.com/luxass))
* enhance `resolveSafePath` to handle absolute paths within base ([c82c2f65](https://github.com/ucdjs/ucd/commit/c82c2f65aecabd535d70ad427200f628385aa65e)) (by [@luxass](https://github.com/luxass))
* enhance path resolution security and add tests for root base behavior ([e00d95c7](https://github.com/ucdjs/ucd/commit/e00d95c720ce0c9bced7a06fe636b1b83a68605c)) (by [@luxass](https://github.com/luxass))
* enhance path validation and security measures ([a49c12f4](https://github.com/ucdjs/ucd/commit/a49c12f466bf5d395e0ac298aeab17009df82186)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5)) (by [@luxass](https://github.com/luxass))
* add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2)) (by [@luxass](https://github.com/luxass))
* update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e)) (by [@luxass](https://github.com/luxass))
* add debug symbol to file system bridge ([6763abcd](https://github.com/ucdjs/ucd/commit/6763abcd8202777afdfb418e185f1b548e9c713c)) (by [@luxass](https://github.com/luxass))
* update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74)) (by [@luxass](https://github.com/luxass))
* add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* update tests to use UCDJS_STORE_BASE_URL ([82721278](https://github.com/ucdjs/ucd/commit/82721278e8535a6863e9e8b04ad891b9c8752c91)) (by [@luxass](https://github.com/luxass))
* update base URL to use UCDJS_STORE_BASE_URL in tests ([b24682e0](https://github.com/ucdjs/ucd/commit/b24682e08f41038793879ed27141bc07154f6928)) (by [@luxass](https://github.com/luxass))
* update default API base URL to use UCDJS_STORE_BASE_URL ([061d7f0b](https://github.com/ucdjs/ucd/commit/061d7f0b930f4c360dfb185d9e5419a632b7a498)) (by [@luxass](https://github.com/luxass))
* add optional chaining to bridge methods ([67832895](https://github.com/ucdjs/ucd/commit/6783289542f2dfc0d12fdeecd45144c810846557)) (by [@luxass](https://github.com/luxass))
* update error handling to use BridgeBaseError ([eacb0e9c](https://github.com/ucdjs/ucd/commit/eacb0e9cab9d9e1a7f7e555b622c01d677fe5c1a)) (by [@luxass](https://github.com/luxass))
* improve error handling in toMatchError matcher ([a7cb1e08](https://github.com/ucdjs/ucd/commit/a7cb1e08ca81931553d5d53d579e5571501f5d0c)) (by [@luxass](https://github.com/luxass))
* improve error handling in `handleError` function ([4ad7725c](https://github.com/ucdjs/ucd/commit/4ad7725c82ccb107d35d2ca405c0c469c4fc0b82)) (by [@luxass](https://github.com/luxass))
* convert strings to errors ([e5da9589](https://github.com/ucdjs/ucd/commit/e5da95891c6d22233cd2f60769585e45a68e14e9)) (by [@luxass](https://github.com/luxass))
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* make hooks call asynchronous and ensure proper error handling ([32d96256](https://github.com/ucdjs/ucd/commit/32d962567f775e11415f5e85c59afe46980b3dd5)) (by [@luxass](https://github.com/luxass))
* replace `hooxs` with `hookable` and update hook method calls ([666ac4c1](https://github.com/ucdjs/ucd/commit/666ac4c173c9177b07aa26bf19350fb836adce32)) (by [@luxass](https://github.com/luxass))
* update `entries` type in hook payload to use `FSEntry[]` ([96d73c06](https://github.com/ucdjs/ucd/commit/96d73c06dc4d0e446640b7a7c0627afb3fc72a3d)) (by [@luxass](https://github.com/luxass))
* correct unsupported operation handling in defineFileSystemBridge ([722f516c](https://github.com/ucdjs/ucd/commit/722f516c7f6518dfdbdc7725f2da6a72b3505f7b)) (by [@luxass](https://github.com/luxass))
* use `structuredClone` for state in `defineFileSystemBridge` ([cb28a42e](https://github.com/ucdjs/ucd/commit/cb28a42eca70bbcdaf2a8d3425721de7bef21bf9)) (by [@luxass](https://github.com/luxass))
* set default type for TOptionsSchema in defineFileSystemBridge ([a37a81c2](https://github.com/ucdjs/ucd/commit/a37a81c2b5c0adc5c130312fce50a6e1697f0713)) (by [@luxass](https://github.com/luxass))
* improve error handling during bridge setup ([efad5a3a](https://github.com/ucdjs/ucd/commit/efad5a3a4d5bfabeb7fd83e27bd7eebc57b07aa4)) (by [@luxass](https://github.com/luxass))
* enhance error handling with PathUtilsBaseError ([87bb2163](https://github.com/ucdjs/ucd/commit/87bb21639252ed895ec3e67f8a158911bb4339be)) (by [@luxass](https://github.com/luxass))
* improve proxy method handling in defineFileSystemBridge ([93bc2610](https://github.com/ucdjs/ucd/commit/93bc2610e0aab663000c3bd26f54d615cf6a2d77)) (by [@luxass](https://github.com/luxass))
* refine error handling and type assertions in proxy methods ([b93ae49e](https://github.com/ucdjs/ucd/commit/b93ae49e7d413efb1d74ef94f21360ed36619f9a)) (by [@luxass](https://github.com/luxass))
* enhance error handling for promise operations ([9c054b6f](https://github.com/ucdjs/ucd/commit/9c054b6f51cf6a3c633855ac1fa9740f14a35af8)) (by [@luxass](https://github.com/luxass))
* refine constructor for BridgeBaseError and remove duplicate class definition ([1147df55](https://github.com/ucdjs/ucd/commit/1147df55c2546866e3230dcdbdc949c469bba937)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([b7c733dd](https://github.com/ucdjs/ucd/commit/b7c733dd6ed1ac420d80273e275125e1e19955d2)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([13043af5](https://github.com/ucdjs/ucd/commit/13043af591eb21cbac1999a6d12768da3daad81a)) (by [@luxass](https://github.com/luxass))
* improve error handling in proxy methods ([798c9cb4](https://github.com/ucdjs/ucd/commit/798c9cb4ec34b25f9f416af1e8bf0f53d5fc2686)) (by [@luxass](https://github.com/luxass))
* ensure original method context is preserved in proxy ([e0453470](https://github.com/ucdjs/ucd/commit/e0453470288b7d998a3254b814f04a0eed786502)) (by [@luxass](https://github.com/luxass))
* improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf)) (by [@luxass](https://github.com/luxass))
* improve error handling for HEAD requests ([261cf461](https://github.com/ucdjs/ucd/commit/261cf4611edc6bc2fc981e4521684e0c530d8262)) (by [@luxass](https://github.com/luxass))
* improve error handling for invalid URL encoding in path resolution ([a5ef25cf](https://github.com/ucdjs/ucd/commit/a5ef25cff9ddc98b2c7bf55c9ae324ba6668f115)) (by [@luxass](https://github.com/luxass))
* improve error messaging for dangerous control characters in path resolution ([98dd1c02](https://github.com/ucdjs/ucd/commit/98dd1c023dd428a9ddbe3e45517d776b0ab99bdf)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))
## [0.1.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.1-beta.0...@ucdjs/fs-bridge@0.1.1-beta.1) (2026-02-15)


### 🚀 Features
* add path validation for listdir tests ([b3df8a65](https://github.com/ucdjs/ucd/commit/b3df8a6540495322e26021763ca5f42f295e13d7)) (by [@luxass](https://github.com/luxass))
* format paths with leading and trailing slashes ([df9b301f](https://github.com/ucdjs/ucd/commit/df9b301f1e1c1ab3a00e20a385c5468486ece95a)) (by [@luxass](https://github.com/luxass))
* add symbol support for HTTP bridge definition ([1c3664e8](https://github.com/ucdjs/ucd/commit/1c3664e84e593f0a13d74227e18b60d50e892af3)) (by [@luxass](https://github.com/luxass))
* add detailed documentation for listdir method ([22ecdde9](https://github.com/ucdjs/ucd/commit/22ecdde986bd1214a44db3bb7a5feac116a5058c)) (by [@luxass](https://github.com/luxass))
* add node and http playground scripts ([eda5a23a](https://github.com/ucdjs/ucd/commit/eda5a23a95fcb7443db5da84ebeff64921efe1b0)) (by [@luxass](https://github.com/luxass))
* add isBuiltinHttpBridge function and update exports ([264723a6](https://github.com/ucdjs/ucd/commit/264723a61c72fda87cdc868ab043745b8a28cd8e)) (by [@luxass](https://github.com/luxass))
* add custom error matcher and update Vitest setup ([647a592b](https://github.com/ucdjs/ucd/commit/647a592bcbfc82eade3559df3113f9f4c8707745)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* complete security tests for fs-bridge path resolution ([e35cd457](https://github.com/ucdjs/ucd/commit/e35cd4572b56e4c5d7845984b2c0cea724fa0478)) (by [@luxass](https://github.com/luxass))
* implement comprehensive HTTP bridge security tests ([c8b13e05](https://github.com/ucdjs/ucd/commit/c8b13e0552ca9881bbc84f67b75f40acf67ccfa6)) (by [@luxass](https://github.com/luxass))
* add utility functions for hook payload construction and operation wrapping ([f90f3b87](https://github.com/ucdjs/ucd/commit/f90f3b873044aaecac01aa96df13b2adc58582be)) (by [@luxass](https://github.com/luxass))
* upgrade hookable ([PR #378](https://github.com/ucdjs/ucd/pull/378)) ([4591756b](https://github.com/ucdjs/ucd/commit/4591756bac443dd4b2a7c1c7e0f66e4d69edb11b)) (by [@luxass](https://github.com/luxass))
* add `encoding` property to hook payload for `write:before` ([c5de8fbe](https://github.com/ucdjs/ucd/commit/c5de8fbeba60bb699bfd5443dade1c3abcf0bfee)) (by [@luxass](https://github.com/luxass))
* enhance hook payload types and improve type safety ([677ab0e2](https://github.com/ucdjs/ucd/commit/677ab0e27ef74a5842cf3655ff8d9dbefc06ff5c)) (by [@luxass](https://github.com/luxass))
* enhance `rm` operation payload and update hook signatures ([6ef1d6d2](https://github.com/ucdjs/ucd/commit/6ef1d6d2d98de13706656a77b987f0677a373498)) (by [@luxass](https://github.com/luxass))
* define supported bridge operations ([4a2df972](https://github.com/ucdjs/ucd/commit/4a2df97258d9e551ba5768756e6ce2ac39cd826f)) (by [@luxass](https://github.com/luxass))
* integrate hooks for file system operations ([9e8dbe64](https://github.com/ucdjs/ucd/commit/9e8dbe6444a291ee7f590ca63468d0567cbd14c5)) (by [@luxass](https://github.com/luxass))
* add `hasCapability` function to guard bridge capabilities ([7df47eb7](https://github.com/ucdjs/ucd/commit/7df47eb7d4a8f71f533dece8eb451b4bbb241456)) (by [@luxass](https://github.com/luxass))
* add FileSystemBridgeFactory type export ([8d42c7f9](https://github.com/ucdjs/ucd/commit/8d42c7f9165b6c11cd84b26f9bb04b77251ec0f0)) (by [@luxass](https://github.com/luxass))
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* add support for data mirroring in FileSystemBridgeMetadata ([f5df4435](https://github.com/ucdjs/ucd/commit/f5df4435bdaeb482eec7821d05bbc4c9a44fa55a)) (by [@luxass](https://github.com/luxass))
* make metadata optional in FileSystemBridge interfaces ([9f202d0a](https://github.com/ucdjs/ucd/commit/9f202d0a5795cf1a19ddf9be61ce4bb926b72afd)) (by [@luxass](https://github.com/luxass))
* add metadata and descriptive fields to HTTP and Node.js bridges ([7bf84348](https://github.com/ucdjs/ucd/commit/7bf84348f754296579d7965fc65e8a58aee09c04)) (by [@luxass](https://github.com/luxass))
* enhance FileSystemBridge with metadata and descriptive fields ([a35231e3](https://github.com/ucdjs/ucd/commit/a35231e30985f277af04a005380923a49e90ef42)) (by [@luxass](https://github.com/luxass))
* add BridgeSetupError class for enhanced error handling ([473b7255](https://github.com/ucdjs/ucd/commit/473b7255bfc71e33547c9b95cb68f6dfffb3aa04)) (by [@luxass](https://github.com/luxass))
* integrate `resolveSafePath` into file system bridge setup ([5cadac4d](https://github.com/ucdjs/ucd/commit/5cadac4df129cace5b6c4ded1b760853eed5c646)) (by [@luxass](https://github.com/luxass))
* add path resolution functions for security ([c9ff1916](https://github.com/ucdjs/ucd/commit/c9ff19164fb0d352ad18e6fa24fd72c49a28d9d2)) (by [@luxass](https://github.com/luxass))
* update TypeScript configuration and add tsconfig dependency ([fcd13059](https://github.com/ucdjs/ucd/commit/fcd13059257d336b31620a5fd64fc2cdff0192e9)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* support Uint8Array ([2f554138](https://github.com/ucdjs/ucd/commit/2f554138b55bd5e0624071f0798e5f40ef6cb651)) (by [@luxass](https://github.com/luxass))
* implement capability assertion and error handling ([43ef6402](https://github.com/ucdjs/ucd/commit/43ef6402e9e539353fc20adb9ca6b7c3389b9767)) (by [@luxass](https://github.com/luxass))
* enhance `resolveSafePath` to handle absolute paths within base ([c82c2f65](https://github.com/ucdjs/ucd/commit/c82c2f65aecabd535d70ad427200f628385aa65e)) (by [@luxass](https://github.com/luxass))
* enhance path resolution security and add tests for root base behavior ([e00d95c7](https://github.com/ucdjs/ucd/commit/e00d95c720ce0c9bced7a06fe636b1b83a68605c)) (by [@luxass](https://github.com/luxass))
* enhance path validation and security measures ([a49c12f4](https://github.com/ucdjs/ucd/commit/a49c12f466bf5d395e0ac298aeab17009df82186)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5)) (by [@luxass](https://github.com/luxass))
* add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2)) (by [@luxass](https://github.com/luxass))
* update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e)) (by [@luxass](https://github.com/luxass))
* add debug symbol to file system bridge ([6763abcd](https://github.com/ucdjs/ucd/commit/6763abcd8202777afdfb418e185f1b548e9c713c)) (by [@luxass](https://github.com/luxass))
* update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74)) (by [@luxass](https://github.com/luxass))
* add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* update tests to use UCDJS_STORE_BASE_URL ([82721278](https://github.com/ucdjs/ucd/commit/82721278e8535a6863e9e8b04ad891b9c8752c91)) (by [@luxass](https://github.com/luxass))
* update base URL to use UCDJS_STORE_BASE_URL in tests ([b24682e0](https://github.com/ucdjs/ucd/commit/b24682e08f41038793879ed27141bc07154f6928)) (by [@luxass](https://github.com/luxass))
* update default API base URL to use UCDJS_STORE_BASE_URL ([061d7f0b](https://github.com/ucdjs/ucd/commit/061d7f0b930f4c360dfb185d9e5419a632b7a498)) (by [@luxass](https://github.com/luxass))
* add optional chaining to bridge methods ([67832895](https://github.com/ucdjs/ucd/commit/6783289542f2dfc0d12fdeecd45144c810846557)) (by [@luxass](https://github.com/luxass))
* update error handling to use BridgeBaseError ([eacb0e9c](https://github.com/ucdjs/ucd/commit/eacb0e9cab9d9e1a7f7e555b622c01d677fe5c1a)) (by [@luxass](https://github.com/luxass))
* improve error handling in toMatchError matcher ([a7cb1e08](https://github.com/ucdjs/ucd/commit/a7cb1e08ca81931553d5d53d579e5571501f5d0c)) (by [@luxass](https://github.com/luxass))
* improve error handling in `handleError` function ([4ad7725c](https://github.com/ucdjs/ucd/commit/4ad7725c82ccb107d35d2ca405c0c469c4fc0b82)) (by [@luxass](https://github.com/luxass))
* convert strings to errors ([e5da9589](https://github.com/ucdjs/ucd/commit/e5da95891c6d22233cd2f60769585e45a68e14e9)) (by [@luxass](https://github.com/luxass))
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* make hooks call asynchronous and ensure proper error handling ([32d96256](https://github.com/ucdjs/ucd/commit/32d962567f775e11415f5e85c59afe46980b3dd5)) (by [@luxass](https://github.com/luxass))
* replace `hooxs` with `hookable` and update hook method calls ([666ac4c1](https://github.com/ucdjs/ucd/commit/666ac4c173c9177b07aa26bf19350fb836adce32)) (by [@luxass](https://github.com/luxass))
* update `entries` type in hook payload to use `FSEntry[]` ([96d73c06](https://github.com/ucdjs/ucd/commit/96d73c06dc4d0e446640b7a7c0627afb3fc72a3d)) (by [@luxass](https://github.com/luxass))
* correct unsupported operation handling in defineFileSystemBridge ([722f516c](https://github.com/ucdjs/ucd/commit/722f516c7f6518dfdbdc7725f2da6a72b3505f7b)) (by [@luxass](https://github.com/luxass))
* use `structuredClone` for state in `defineFileSystemBridge` ([cb28a42e](https://github.com/ucdjs/ucd/commit/cb28a42eca70bbcdaf2a8d3425721de7bef21bf9)) (by [@luxass](https://github.com/luxass))
* set default type for TOptionsSchema in defineFileSystemBridge ([a37a81c2](https://github.com/ucdjs/ucd/commit/a37a81c2b5c0adc5c130312fce50a6e1697f0713)) (by [@luxass](https://github.com/luxass))
* improve error handling during bridge setup ([efad5a3a](https://github.com/ucdjs/ucd/commit/efad5a3a4d5bfabeb7fd83e27bd7eebc57b07aa4)) (by [@luxass](https://github.com/luxass))
* enhance error handling with PathUtilsBaseError ([87bb2163](https://github.com/ucdjs/ucd/commit/87bb21639252ed895ec3e67f8a158911bb4339be)) (by [@luxass](https://github.com/luxass))
* improve proxy method handling in defineFileSystemBridge ([93bc2610](https://github.com/ucdjs/ucd/commit/93bc2610e0aab663000c3bd26f54d615cf6a2d77)) (by [@luxass](https://github.com/luxass))
* refine error handling and type assertions in proxy methods ([b93ae49e](https://github.com/ucdjs/ucd/commit/b93ae49e7d413efb1d74ef94f21360ed36619f9a)) (by [@luxass](https://github.com/luxass))
* enhance error handling for promise operations ([9c054b6f](https://github.com/ucdjs/ucd/commit/9c054b6f51cf6a3c633855ac1fa9740f14a35af8)) (by [@luxass](https://github.com/luxass))
* refine constructor for BridgeBaseError and remove duplicate class definition ([1147df55](https://github.com/ucdjs/ucd/commit/1147df55c2546866e3230dcdbdc949c469bba937)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([b7c733dd](https://github.com/ucdjs/ucd/commit/b7c733dd6ed1ac420d80273e275125e1e19955d2)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([13043af5](https://github.com/ucdjs/ucd/commit/13043af591eb21cbac1999a6d12768da3daad81a)) (by [@luxass](https://github.com/luxass))
* improve error handling in proxy methods ([798c9cb4](https://github.com/ucdjs/ucd/commit/798c9cb4ec34b25f9f416af1e8bf0f53d5fc2686)) (by [@luxass](https://github.com/luxass))
* ensure original method context is preserved in proxy ([e0453470](https://github.com/ucdjs/ucd/commit/e0453470288b7d998a3254b814f04a0eed786502)) (by [@luxass](https://github.com/luxass))
* improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf)) (by [@luxass](https://github.com/luxass))
* improve error handling for HEAD requests ([261cf461](https://github.com/ucdjs/ucd/commit/261cf4611edc6bc2fc981e4521684e0c530d8262)) (by [@luxass](https://github.com/luxass))
* improve error handling for invalid URL encoding in path resolution ([a5ef25cf](https://github.com/ucdjs/ucd/commit/a5ef25cff9ddc98b2c7bf55c9ae324ba6668f115)) (by [@luxass](https://github.com/luxass))
* improve error messaging for dangerous control characters in path resolution ([98dd1c02](https://github.com/ucdjs/ucd/commit/98dd1c023dd428a9ddbe3e45517d776b0ab99bdf)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))


## [0.1.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/fs-bridge@0.1.0...@ucdjs/fs-bridge@0.1.1-beta.0) (2026-02-15)


### 🚀 Features
* add path validation for listdir tests ([b3df8a65](https://github.com/ucdjs/ucd/commit/b3df8a6540495322e26021763ca5f42f295e13d7)) (by [@luxass](https://github.com/luxass))
* format paths with leading and trailing slashes ([df9b301f](https://github.com/ucdjs/ucd/commit/df9b301f1e1c1ab3a00e20a385c5468486ece95a)) (by [@luxass](https://github.com/luxass))
* add symbol support for HTTP bridge definition ([1c3664e8](https://github.com/ucdjs/ucd/commit/1c3664e84e593f0a13d74227e18b60d50e892af3)) (by [@luxass](https://github.com/luxass))
* add detailed documentation for listdir method ([22ecdde9](https://github.com/ucdjs/ucd/commit/22ecdde986bd1214a44db3bb7a5feac116a5058c)) (by [@luxass](https://github.com/luxass))
* add node and http playground scripts ([eda5a23a](https://github.com/ucdjs/ucd/commit/eda5a23a95fcb7443db5da84ebeff64921efe1b0)) (by [@luxass](https://github.com/luxass))
* add isBuiltinHttpBridge function and update exports ([264723a6](https://github.com/ucdjs/ucd/commit/264723a61c72fda87cdc868ab043745b8a28cd8e)) (by [@luxass](https://github.com/luxass))
* add custom error matcher and update Vitest setup ([647a592b](https://github.com/ucdjs/ucd/commit/647a592bcbfc82eade3559df3113f9f4c8707745)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* complete security tests for fs-bridge path resolution ([e35cd457](https://github.com/ucdjs/ucd/commit/e35cd4572b56e4c5d7845984b2c0cea724fa0478)) (by [@luxass](https://github.com/luxass))
* implement comprehensive HTTP bridge security tests ([c8b13e05](https://github.com/ucdjs/ucd/commit/c8b13e0552ca9881bbc84f67b75f40acf67ccfa6)) (by [@luxass](https://github.com/luxass))
* add utility functions for hook payload construction and operation wrapping ([f90f3b87](https://github.com/ucdjs/ucd/commit/f90f3b873044aaecac01aa96df13b2adc58582be)) (by [@luxass](https://github.com/luxass))
* upgrade hookable ([PR #378](https://github.com/ucdjs/ucd/pull/378)) ([4591756b](https://github.com/ucdjs/ucd/commit/4591756bac443dd4b2a7c1c7e0f66e4d69edb11b)) (by [@luxass](https://github.com/luxass))
* add `encoding` property to hook payload for `write:before` ([c5de8fbe](https://github.com/ucdjs/ucd/commit/c5de8fbeba60bb699bfd5443dade1c3abcf0bfee)) (by [@luxass](https://github.com/luxass))
* enhance hook payload types and improve type safety ([677ab0e2](https://github.com/ucdjs/ucd/commit/677ab0e27ef74a5842cf3655ff8d9dbefc06ff5c)) (by [@luxass](https://github.com/luxass))
* enhance `rm` operation payload and update hook signatures ([6ef1d6d2](https://github.com/ucdjs/ucd/commit/6ef1d6d2d98de13706656a77b987f0677a373498)) (by [@luxass](https://github.com/luxass))
* define supported bridge operations ([4a2df972](https://github.com/ucdjs/ucd/commit/4a2df97258d9e551ba5768756e6ce2ac39cd826f)) (by [@luxass](https://github.com/luxass))
* integrate hooks for file system operations ([9e8dbe64](https://github.com/ucdjs/ucd/commit/9e8dbe6444a291ee7f590ca63468d0567cbd14c5)) (by [@luxass](https://github.com/luxass))
* add `hasCapability` function to guard bridge capabilities ([7df47eb7](https://github.com/ucdjs/ucd/commit/7df47eb7d4a8f71f533dece8eb451b4bbb241456)) (by [@luxass](https://github.com/luxass))
* add FileSystemBridgeFactory type export ([8d42c7f9](https://github.com/ucdjs/ucd/commit/8d42c7f9165b6c11cd84b26f9bb04b77251ec0f0)) (by [@luxass](https://github.com/luxass))
* migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9)) (by [@luxass](https://github.com/luxass))
* add support for data mirroring in FileSystemBridgeMetadata ([f5df4435](https://github.com/ucdjs/ucd/commit/f5df4435bdaeb482eec7821d05bbc4c9a44fa55a)) (by [@luxass](https://github.com/luxass))
* make metadata optional in FileSystemBridge interfaces ([9f202d0a](https://github.com/ucdjs/ucd/commit/9f202d0a5795cf1a19ddf9be61ce4bb926b72afd)) (by [@luxass](https://github.com/luxass))
* add metadata and descriptive fields to HTTP and Node.js bridges ([7bf84348](https://github.com/ucdjs/ucd/commit/7bf84348f754296579d7965fc65e8a58aee09c04)) (by [@luxass](https://github.com/luxass))
* enhance FileSystemBridge with metadata and descriptive fields ([a35231e3](https://github.com/ucdjs/ucd/commit/a35231e30985f277af04a005380923a49e90ef42)) (by [@luxass](https://github.com/luxass))
* add BridgeSetupError class for enhanced error handling ([473b7255](https://github.com/ucdjs/ucd/commit/473b7255bfc71e33547c9b95cb68f6dfffb3aa04)) (by [@luxass](https://github.com/luxass))
* integrate `resolveSafePath` into file system bridge setup ([5cadac4d](https://github.com/ucdjs/ucd/commit/5cadac4df129cace5b6c4ded1b760853eed5c646)) (by [@luxass](https://github.com/luxass))
* add path resolution functions for security ([c9ff1916](https://github.com/ucdjs/ucd/commit/c9ff19164fb0d352ad18e6fa24fd72c49a28d9d2)) (by [@luxass](https://github.com/luxass))
* update TypeScript configuration and add tsconfig dependency ([fcd13059](https://github.com/ucdjs/ucd/commit/fcd13059257d336b31620a5fd64fc2cdff0192e9)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* support Uint8Array ([2f554138](https://github.com/ucdjs/ucd/commit/2f554138b55bd5e0624071f0798e5f40ef6cb651)) (by [@luxass](https://github.com/luxass))
* implement capability assertion and error handling ([43ef6402](https://github.com/ucdjs/ucd/commit/43ef6402e9e539353fc20adb9ca6b7c3389b9767)) (by [@luxass](https://github.com/luxass))
* enhance `resolveSafePath` to handle absolute paths within base ([c82c2f65](https://github.com/ucdjs/ucd/commit/c82c2f65aecabd535d70ad427200f628385aa65e)) (by [@luxass](https://github.com/luxass))
* enhance path resolution security and add tests for root base behavior ([e00d95c7](https://github.com/ucdjs/ucd/commit/e00d95c720ce0c9bced7a06fe636b1b83a68605c)) (by [@luxass](https://github.com/luxass))
* enhance path validation and security measures ([a49c12f4](https://github.com/ucdjs/ucd/commit/a49c12f466bf5d395e0ac298aeab17009df82186)) (by [@luxass](https://github.com/luxass))
* update UCD store schemas and handling ([8b90a374](https://github.com/ucdjs/ucd/commit/8b90a3741bc8d46ae9ab2764f94c2ef041e00689)) (by [@luxass](https://github.com/luxass))
* update import paths for fs-bridge module ([8060e4de](https://github.com/ucdjs/ucd/commit/8060e4deeb393d330404ab4a50dd01770310bbe5)) (by [@luxass](https://github.com/luxass))
* add internal debug symbol and update exports ([b0d5d5d0](https://github.com/ucdjs/ucd/commit/b0d5d5d0e00d16de02d4ef25183701e7ee0ab2e2)) (by [@luxass](https://github.com/luxass))
* update internal debug symbol and enhance type safety ([df963c65](https://github.com/ucdjs/ucd/commit/df963c65121041eee6b8ec63df03f2452783843e)) (by [@luxass](https://github.com/luxass))
* add debug symbol to file system bridge ([6763abcd](https://github.com/ucdjs/ucd/commit/6763abcd8202777afdfb418e185f1b548e9c713c)) (by [@luxass](https://github.com/luxass))
* update import paths and module exports ([99e60ad0](https://github.com/ucdjs/ucd/commit/99e60ad091d26c32ec4c6d89667acca6b4a42c74)) (by [@luxass](https://github.com/luxass))
* add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* update tests to use UCDJS_STORE_BASE_URL ([82721278](https://github.com/ucdjs/ucd/commit/82721278e8535a6863e9e8b04ad891b9c8752c91)) (by [@luxass](https://github.com/luxass))
* update base URL to use UCDJS_STORE_BASE_URL in tests ([b24682e0](https://github.com/ucdjs/ucd/commit/b24682e08f41038793879ed27141bc07154f6928)) (by [@luxass](https://github.com/luxass))
* update default API base URL to use UCDJS_STORE_BASE_URL ([061d7f0b](https://github.com/ucdjs/ucd/commit/061d7f0b930f4c360dfb185d9e5419a632b7a498)) (by [@luxass](https://github.com/luxass))
* add optional chaining to bridge methods ([67832895](https://github.com/ucdjs/ucd/commit/6783289542f2dfc0d12fdeecd45144c810846557)) (by [@luxass](https://github.com/luxass))
* update error handling to use BridgeBaseError ([eacb0e9c](https://github.com/ucdjs/ucd/commit/eacb0e9cab9d9e1a7f7e555b622c01d677fe5c1a)) (by [@luxass](https://github.com/luxass))
* improve error handling in toMatchError matcher ([a7cb1e08](https://github.com/ucdjs/ucd/commit/a7cb1e08ca81931553d5d53d579e5571501f5d0c)) (by [@luxass](https://github.com/luxass))
* improve error handling in `handleError` function ([4ad7725c](https://github.com/ucdjs/ucd/commit/4ad7725c82ccb107d35d2ca405c0c469c4fc0b82)) (by [@luxass](https://github.com/luxass))
* convert strings to errors ([e5da9589](https://github.com/ucdjs/ucd/commit/e5da95891c6d22233cd2f60769585e45a68e14e9)) (by [@luxass](https://github.com/luxass))
* update file paths to include &#39;extracted&#39; prefix ([PR #371](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)) (by [@luxass](https://github.com/luxass))
* make hooks call asynchronous and ensure proper error handling ([32d96256](https://github.com/ucdjs/ucd/commit/32d962567f775e11415f5e85c59afe46980b3dd5)) (by [@luxass](https://github.com/luxass))
* replace `hooxs` with `hookable` and update hook method calls ([666ac4c1](https://github.com/ucdjs/ucd/commit/666ac4c173c9177b07aa26bf19350fb836adce32)) (by [@luxass](https://github.com/luxass))
* update `entries` type in hook payload to use `FSEntry[]` ([96d73c06](https://github.com/ucdjs/ucd/commit/96d73c06dc4d0e446640b7a7c0627afb3fc72a3d)) (by [@luxass](https://github.com/luxass))
* correct unsupported operation handling in defineFileSystemBridge ([722f516c](https://github.com/ucdjs/ucd/commit/722f516c7f6518dfdbdc7725f2da6a72b3505f7b)) (by [@luxass](https://github.com/luxass))
* use `structuredClone` for state in `defineFileSystemBridge` ([cb28a42e](https://github.com/ucdjs/ucd/commit/cb28a42eca70bbcdaf2a8d3425721de7bef21bf9)) (by [@luxass](https://github.com/luxass))
* set default type for TOptionsSchema in defineFileSystemBridge ([a37a81c2](https://github.com/ucdjs/ucd/commit/a37a81c2b5c0adc5c130312fce50a6e1697f0713)) (by [@luxass](https://github.com/luxass))
* improve error handling during bridge setup ([efad5a3a](https://github.com/ucdjs/ucd/commit/efad5a3a4d5bfabeb7fd83e27bd7eebc57b07aa4)) (by [@luxass](https://github.com/luxass))
* enhance error handling with PathUtilsBaseError ([87bb2163](https://github.com/ucdjs/ucd/commit/87bb21639252ed895ec3e67f8a158911bb4339be)) (by [@luxass](https://github.com/luxass))
* improve proxy method handling in defineFileSystemBridge ([93bc2610](https://github.com/ucdjs/ucd/commit/93bc2610e0aab663000c3bd26f54d615cf6a2d77)) (by [@luxass](https://github.com/luxass))
* refine error handling and type assertions in proxy methods ([b93ae49e](https://github.com/ucdjs/ucd/commit/b93ae49e7d413efb1d74ef94f21360ed36619f9a)) (by [@luxass](https://github.com/luxass))
* enhance error handling for promise operations ([9c054b6f](https://github.com/ucdjs/ucd/commit/9c054b6f51cf6a3c633855ac1fa9740f14a35af8)) (by [@luxass](https://github.com/luxass))
* refine constructor for BridgeBaseError and remove duplicate class definition ([1147df55](https://github.com/ucdjs/ucd/commit/1147df55c2546866e3230dcdbdc949c469bba937)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([b7c733dd](https://github.com/ucdjs/ucd/commit/b7c733dd6ed1ac420d80273e275125e1e19955d2)) (by [@luxass](https://github.com/luxass))
* refine type assertion for original method in proxy ([13043af5](https://github.com/ucdjs/ucd/commit/13043af591eb21cbac1999a6d12768da3daad81a)) (by [@luxass](https://github.com/luxass))
* improve error handling in proxy methods ([798c9cb4](https://github.com/ucdjs/ucd/commit/798c9cb4ec34b25f9f416af1e8bf0f53d5fc2686)) (by [@luxass](https://github.com/luxass))
* ensure original method context is preserved in proxy ([e0453470](https://github.com/ucdjs/ucd/commit/e0453470288b7d998a3254b814f04a0eed786502)) (by [@luxass](https://github.com/luxass))
* improve error messaging and initialization logic ([dad79c58](https://github.com/ucdjs/ucd/commit/dad79c580ec37c2bd75c6cb2faaca3ada733ddbf)) (by [@luxass](https://github.com/luxass))
* improve error handling for HEAD requests ([261cf461](https://github.com/ucdjs/ucd/commit/261cf4611edc6bc2fc981e4521684e0c530d8262)) (by [@luxass](https://github.com/luxass))
* improve error handling for invalid URL encoding in path resolution ([a5ef25cf](https://github.com/ucdjs/ucd/commit/a5ef25cff9ddc98b2c7bf55c9ae324ba6668f115)) (by [@luxass](https://github.com/luxass))
* improve error messaging for dangerous control characters in path resolution ([98dd1c02](https://github.com/ucdjs/ucd/commit/98dd1c023dd428a9ddbe3e45517d776b0ab99bdf)) (by [@luxass](https://github.com/luxass))
* enhance error handling and directory listing logic ([02be1238](https://github.com/ucdjs/ucd/commit/02be1238ee1e5a63ce75d8e44385bc36c4b3a256)) (by [@luxass](https://github.com/luxass))


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
