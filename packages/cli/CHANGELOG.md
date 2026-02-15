# @ucdjs/cli

## [0.3.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.1-beta.3...@ucdjs/cli@0.3.1-beta.4) (2026-02-15)



### 🚀 Features
* add pipelines commands and related functionality ([03e634d3](https://github.com/ucdjs/ucd/commit/03e634d3b93b68c6a1eb0ad3eb4af195156d9d7b)) (by [@luxass](https://github.com/luxass))


## [0.3.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.1-beta.2...@ucdjs/cli@0.3.1-beta.2) (2026-02-15)


### 🚀 Features
* add &#39;validate&#39; subcommand for lockfile validation ([229a1e2c](https://github.com/ucdjs/ucd/commit/229a1e2c3071e25b331e5935aa2462d27209af07)) (by [@luxass](https://github.com/luxass))
* add &#39;info&#39; subcommand for lockfile details ([d930a9d1](https://github.com/ucdjs/ucd/commit/d930a9d1eac7bc16103f76ba831a62f7872854f6)) (by [@luxass](https://github.com/luxass))
* add hash subcommand for computing file hashes ([b24a3d0e](https://github.com/ucdjs/ucd/commit/b24a3d0e43314832659d8459bda59c479fbd234e)) (by [@luxass](https://github.com/luxass))
* add lockfile command for UCD store management ([0cd6ea05](https://github.com/ucdjs/ucd/commit/0cd6ea051f7bfd2ebd6f788fb3a4bb1364198e7c)) (by [@luxass](https://github.com/luxass))
* add CLIError class for improved error handling ([f74a2692](https://github.com/ucdjs/ucd/commit/f74a2692cb8f6eac86f36d04470107b930fb8bdb)) (by [@luxass](https://github.com/luxass))
* update file listing to use FileEntryList type ([25443c68](https://github.com/ucdjs/ucd/commit/25443c6866333bcf2dd87e26210a3dd66731acbe)) (by [@luxass](https://github.com/luxass))
* refactor output logging and formatBytes function ([0e97978a](https://github.com/ucdjs/ucd/commit/0e97978a81401b10efeb9005e903be9089cc4fca)) (by [@luxass](https://github.com/luxass))
* update output logging for file operations ([371f9665](https://github.com/ucdjs/ucd/commit/371f96659684fee3183bf67d3abfd9256aac7b8b)) (by [@luxass](https://github.com/luxass))
* enhance output functions and add new utilities ([9e870450](https://github.com/ucdjs/ucd/commit/9e870450b3309a69aa4f4247a309aed521f2d1ce)) (by [@luxass](https://github.com/luxass))
* migrate from `@ucdjs/ucd-store-v2` to `@ucdjs/ucd-store` ([f7538ad8](https://github.com/ucdjs/ucd/commit/f7538ad8da9de36835b0dbc14d2e0bfc711e154b)) (by [@luxass](https://github.com/luxass))
* improve debug logs ([7632426c](https://github.com/ucdjs/ucd/commit/7632426cd3e43c4d8db5cf1b3090c08061710b07)) (by [@luxass](https://github.com/luxass))
* add info subcommand to files cmd ([33e8dcab](https://github.com/ucdjs/ucd/commit/33e8dcabeee69978fc1fd770475f12e01e90076d)) (by [@luxass](https://github.com/luxass))
* use stderr for casual logs when paired with --json ([904dd049](https://github.com/ucdjs/ucd/commit/904dd0497130f1450e6bc6d9e5bd8da43abfd436)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* add file management commands to CLI ([40b8d0ce](https://github.com/ucdjs/ucd/commit/40b8d0ce98b4564041ece612c9f31183013740a7)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* fix analyze type errors and resolve double directory path issue ([1edd1365](https://github.com/ucdjs/ucd/commit/1edd13650034928df9453ecd4ed9f3411c3f6de8)) (by [@luxass](https://github.com/luxass))
* redesign store commands for ucd-store-v2 API ([a5e12a5e](https://github.com/ucdjs/ucd/commit/a5e12a5ed045d68a43dedc8e0df5f3f817ef4239)) (by [@luxass](https://github.com/luxass))
* update CLIStoreCmdSharedFlags to use include/exclude patterns ([3a90b66d](https://github.com/ucdjs/ucd/commit/3a90b66dd211f4c4a2608837a4d550ace7a10f73)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* enhance store initialization with dry-run mode and add tests ([4aee44b0](https://github.com/ucdjs/ucd/commit/4aee44b0cd9449df80e50bdd930ef50c64c8ebe7)) (by [@luxass](https://github.com/luxass))
* add analyze command for UCD store ([b22886ad](https://github.com/ucdjs/ucd/commit/b22886ade9f28bc6f0a8e54f29328376a0a53eec)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([9caa6a34](https://github.com/ucdjs/ucd/commit/9caa6a347138f2f3ec5ec20324c4bca82685ad68)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([27db542d](https://github.com/ucdjs/ucd/commit/27db542d96bd9b9f4f64dcecdf0bad52ff864bf1)) (by [@luxass](https://github.com/luxass))
* add &#39;dev:api&#39; script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)) (by [@luxass](https://github.com/luxass))
* implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303)) (by [@luxass](https://github.com/luxass))
* add store commands for clean, repair, status, and validate ([ed47d40a](https://github.com/ucdjs/ucd/commit/ed47d40a7e3b7dd4413c068469abc2cc1aec6474)) (by [@luxass](https://github.com/luxass))
* add store command ([0ba52fac](https://github.com/ucdjs/ucd/commit/0ba52fac19f587fc8428c07580424d7861fdc298)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))
* add HTML and README file exclusion options to download command ([36d1bc0e](https://github.com/ucdjs/ucd/commit/36d1bc0ee832e67f211613b0d962dc86a2b0fb3f)) (by [@luxass](https://github.com/luxass))
* enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588)) (by [@luxass](https://github.com/luxass))
* enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* change console method from info to log in help command test ([4b0cb662](https://github.com/ucdjs/ucd/commit/4b0cb6623a2496afdcab1174fc959938d39d6885)) (by [@luxass](https://github.com/luxass))
* improve mirror command ([27990106](https://github.com/ucdjs/ucd/commit/2799010628d9525988907cab4ade90b5e367fbfd)) (by [@luxass](https://github.com/luxass))
* handle include &amp; exclude as arrays ([ba7723f2](https://github.com/ucdjs/ucd/commit/ba7723f2fe6bca0ccf79170770bd5330908f8bd0)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils-old` to `@luxass/unicode-utils` ([b5d2405b](https://github.com/ucdjs/ucd/commit/b5d2405b9993896b207275e4b95b15f75dc872f3)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2)) (by [@luxass](https://github.com/luxass))
* improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e)) (by [@luxass](https://github.com/luxass))
* print correct json output ([1807a7ce](https://github.com/ucdjs/ucd/commit/1807a7ce9a5daf696c7dcc6a67c688f7446907e5)) (by [@luxass](https://github.com/luxass))
* refactor version selection logic in runInitStore ([907a4106](https://github.com/ucdjs/ucd/commit/907a4106033953252b577db2ea80471edcc93c4d)) (by [@luxass](https://github.com/luxass))
* adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9)) (by [@luxass](https://github.com/luxass))
* correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04)) (by [@luxass](https://github.com/luxass))
* correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([3fabe8a0](https://github.com/ucdjs/ucd/commit/3fabe8a0c7b7205c59818ff59864a2dd2525c199)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([1aa8ea49](https://github.com/ucdjs/ucd/commit/1aa8ea49fd0c93964d8111324c642992a91f7a0b)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))
* remove proxyUrl from clean, init, repair, and status commands ([0499e047](https://github.com/ucdjs/ucd/commit/0499e0472b05928fa8aec4a99dc2cffacad511d5)) (by [@luxass](https://github.com/luxass))
## [0.3.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.1-beta.0...@ucdjs/cli@0.3.1-beta.1) (2026-02-15)


### 🚀 Features
* add &#39;validate&#39; subcommand for lockfile validation ([229a1e2c](https://github.com/ucdjs/ucd/commit/229a1e2c3071e25b331e5935aa2462d27209af07)) (by [@luxass](https://github.com/luxass))
* add &#39;info&#39; subcommand for lockfile details ([d930a9d1](https://github.com/ucdjs/ucd/commit/d930a9d1eac7bc16103f76ba831a62f7872854f6)) (by [@luxass](https://github.com/luxass))
* add hash subcommand for computing file hashes ([b24a3d0e](https://github.com/ucdjs/ucd/commit/b24a3d0e43314832659d8459bda59c479fbd234e)) (by [@luxass](https://github.com/luxass))
* add lockfile command for UCD store management ([0cd6ea05](https://github.com/ucdjs/ucd/commit/0cd6ea051f7bfd2ebd6f788fb3a4bb1364198e7c)) (by [@luxass](https://github.com/luxass))
* add CLIError class for improved error handling ([f74a2692](https://github.com/ucdjs/ucd/commit/f74a2692cb8f6eac86f36d04470107b930fb8bdb)) (by [@luxass](https://github.com/luxass))
* update file listing to use FileEntryList type ([25443c68](https://github.com/ucdjs/ucd/commit/25443c6866333bcf2dd87e26210a3dd66731acbe)) (by [@luxass](https://github.com/luxass))
* refactor output logging and formatBytes function ([0e97978a](https://github.com/ucdjs/ucd/commit/0e97978a81401b10efeb9005e903be9089cc4fca)) (by [@luxass](https://github.com/luxass))
* update output logging for file operations ([371f9665](https://github.com/ucdjs/ucd/commit/371f96659684fee3183bf67d3abfd9256aac7b8b)) (by [@luxass](https://github.com/luxass))
* enhance output functions and add new utilities ([9e870450](https://github.com/ucdjs/ucd/commit/9e870450b3309a69aa4f4247a309aed521f2d1ce)) (by [@luxass](https://github.com/luxass))
* migrate from `@ucdjs/ucd-store-v2` to `@ucdjs/ucd-store` ([f7538ad8](https://github.com/ucdjs/ucd/commit/f7538ad8da9de36835b0dbc14d2e0bfc711e154b)) (by [@luxass](https://github.com/luxass))
* improve debug logs ([7632426c](https://github.com/ucdjs/ucd/commit/7632426cd3e43c4d8db5cf1b3090c08061710b07)) (by [@luxass](https://github.com/luxass))
* add info subcommand to files cmd ([33e8dcab](https://github.com/ucdjs/ucd/commit/33e8dcabeee69978fc1fd770475f12e01e90076d)) (by [@luxass](https://github.com/luxass))
* use stderr for casual logs when paired with --json ([904dd049](https://github.com/ucdjs/ucd/commit/904dd0497130f1450e6bc6d9e5bd8da43abfd436)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* add file management commands to CLI ([40b8d0ce](https://github.com/ucdjs/ucd/commit/40b8d0ce98b4564041ece612c9f31183013740a7)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* fix analyze type errors and resolve double directory path issue ([1edd1365](https://github.com/ucdjs/ucd/commit/1edd13650034928df9453ecd4ed9f3411c3f6de8)) (by [@luxass](https://github.com/luxass))
* redesign store commands for ucd-store-v2 API ([a5e12a5e](https://github.com/ucdjs/ucd/commit/a5e12a5ed045d68a43dedc8e0df5f3f817ef4239)) (by [@luxass](https://github.com/luxass))
* update CLIStoreCmdSharedFlags to use include/exclude patterns ([3a90b66d](https://github.com/ucdjs/ucd/commit/3a90b66dd211f4c4a2608837a4d550ace7a10f73)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* enhance store initialization with dry-run mode and add tests ([4aee44b0](https://github.com/ucdjs/ucd/commit/4aee44b0cd9449df80e50bdd930ef50c64c8ebe7)) (by [@luxass](https://github.com/luxass))
* add analyze command for UCD store ([b22886ad](https://github.com/ucdjs/ucd/commit/b22886ade9f28bc6f0a8e54f29328376a0a53eec)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([9caa6a34](https://github.com/ucdjs/ucd/commit/9caa6a347138f2f3ec5ec20324c4bca82685ad68)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([27db542d](https://github.com/ucdjs/ucd/commit/27db542d96bd9b9f4f64dcecdf0bad52ff864bf1)) (by [@luxass](https://github.com/luxass))
* add &#39;dev:api&#39; script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)) (by [@luxass](https://github.com/luxass))
* implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303)) (by [@luxass](https://github.com/luxass))
* add store commands for clean, repair, status, and validate ([ed47d40a](https://github.com/ucdjs/ucd/commit/ed47d40a7e3b7dd4413c068469abc2cc1aec6474)) (by [@luxass](https://github.com/luxass))
* add store command ([0ba52fac](https://github.com/ucdjs/ucd/commit/0ba52fac19f587fc8428c07580424d7861fdc298)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))
* add HTML and README file exclusion options to download command ([36d1bc0e](https://github.com/ucdjs/ucd/commit/36d1bc0ee832e67f211613b0d962dc86a2b0fb3f)) (by [@luxass](https://github.com/luxass))
* enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588)) (by [@luxass](https://github.com/luxass))
* enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* change console method from info to log in help command test ([4b0cb662](https://github.com/ucdjs/ucd/commit/4b0cb6623a2496afdcab1174fc959938d39d6885)) (by [@luxass](https://github.com/luxass))
* improve mirror command ([27990106](https://github.com/ucdjs/ucd/commit/2799010628d9525988907cab4ade90b5e367fbfd)) (by [@luxass](https://github.com/luxass))
* handle include &amp; exclude as arrays ([ba7723f2](https://github.com/ucdjs/ucd/commit/ba7723f2fe6bca0ccf79170770bd5330908f8bd0)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils-old` to `@luxass/unicode-utils` ([b5d2405b](https://github.com/ucdjs/ucd/commit/b5d2405b9993896b207275e4b95b15f75dc872f3)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2)) (by [@luxass](https://github.com/luxass))
* improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e)) (by [@luxass](https://github.com/luxass))
* print correct json output ([1807a7ce](https://github.com/ucdjs/ucd/commit/1807a7ce9a5daf696c7dcc6a67c688f7446907e5)) (by [@luxass](https://github.com/luxass))
* refactor version selection logic in runInitStore ([907a4106](https://github.com/ucdjs/ucd/commit/907a4106033953252b577db2ea80471edcc93c4d)) (by [@luxass](https://github.com/luxass))
* adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9)) (by [@luxass](https://github.com/luxass))
* correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04)) (by [@luxass](https://github.com/luxass))
* correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([3fabe8a0](https://github.com/ucdjs/ucd/commit/3fabe8a0c7b7205c59818ff59864a2dd2525c199)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([1aa8ea49](https://github.com/ucdjs/ucd/commit/1aa8ea49fd0c93964d8111324c642992a91f7a0b)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))
* remove proxyUrl from clean, init, repair, and status commands ([0499e047](https://github.com/ucdjs/ucd/commit/0499e0472b05928fa8aec4a99dc2cffacad511d5)) (by [@luxass](https://github.com/luxass))


## [0.3.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/cli@0.3.0...@ucdjs/cli@0.3.1-beta.0) (2026-02-15)


### 🚀 Features
* add &#39;validate&#39; subcommand for lockfile validation ([229a1e2c](https://github.com/ucdjs/ucd/commit/229a1e2c3071e25b331e5935aa2462d27209af07)) (by [@luxass](https://github.com/luxass))
* add &#39;info&#39; subcommand for lockfile details ([d930a9d1](https://github.com/ucdjs/ucd/commit/d930a9d1eac7bc16103f76ba831a62f7872854f6)) (by [@luxass](https://github.com/luxass))
* add hash subcommand for computing file hashes ([b24a3d0e](https://github.com/ucdjs/ucd/commit/b24a3d0e43314832659d8459bda59c479fbd234e)) (by [@luxass](https://github.com/luxass))
* add lockfile command for UCD store management ([0cd6ea05](https://github.com/ucdjs/ucd/commit/0cd6ea051f7bfd2ebd6f788fb3a4bb1364198e7c)) (by [@luxass](https://github.com/luxass))
* add CLIError class for improved error handling ([f74a2692](https://github.com/ucdjs/ucd/commit/f74a2692cb8f6eac86f36d04470107b930fb8bdb)) (by [@luxass](https://github.com/luxass))
* update file listing to use FileEntryList type ([25443c68](https://github.com/ucdjs/ucd/commit/25443c6866333bcf2dd87e26210a3dd66731acbe)) (by [@luxass](https://github.com/luxass))
* refactor output logging and formatBytes function ([0e97978a](https://github.com/ucdjs/ucd/commit/0e97978a81401b10efeb9005e903be9089cc4fca)) (by [@luxass](https://github.com/luxass))
* update output logging for file operations ([371f9665](https://github.com/ucdjs/ucd/commit/371f96659684fee3183bf67d3abfd9256aac7b8b)) (by [@luxass](https://github.com/luxass))
* enhance output functions and add new utilities ([9e870450](https://github.com/ucdjs/ucd/commit/9e870450b3309a69aa4f4247a309aed521f2d1ce)) (by [@luxass](https://github.com/luxass))
* migrate from `@ucdjs/ucd-store-v2` to `@ucdjs/ucd-store` ([f7538ad8](https://github.com/ucdjs/ucd/commit/f7538ad8da9de36835b0dbc14d2e0bfc711e154b)) (by [@luxass](https://github.com/luxass))
* improve debug logs ([7632426c](https://github.com/ucdjs/ucd/commit/7632426cd3e43c4d8db5cf1b3090c08061710b07)) (by [@luxass](https://github.com/luxass))
* add info subcommand to files cmd ([33e8dcab](https://github.com/ucdjs/ucd/commit/33e8dcabeee69978fc1fd770475f12e01e90076d)) (by [@luxass](https://github.com/luxass))
* use stderr for casual logs when paired with --json ([904dd049](https://github.com/ucdjs/ucd/commit/904dd0497130f1450e6bc6d9e5bd8da43abfd436)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* add file management commands to CLI ([40b8d0ce](https://github.com/ucdjs/ucd/commit/40b8d0ce98b4564041ece612c9f31183013740a7)) (by [@luxass](https://github.com/luxass))
* add write capability assertion and enhance store commands ([a2eb3cd5](https://github.com/ucdjs/ucd/commit/a2eb3cd58bf73a7d5f8f553d583a2084bd816aaf)) (by [@luxass](https://github.com/luxass))
* fix analyze type errors and resolve double directory path issue ([1edd1365](https://github.com/ucdjs/ucd/commit/1edd13650034928df9453ecd4ed9f3411c3f6de8)) (by [@luxass](https://github.com/luxass))
* redesign store commands for ucd-store-v2 API ([a5e12a5e](https://github.com/ucdjs/ucd/commit/a5e12a5ed045d68a43dedc8e0df5f3f817ef4239)) (by [@luxass](https://github.com/luxass))
* update CLIStoreCmdSharedFlags to use include/exclude patterns ([3a90b66d](https://github.com/ucdjs/ucd/commit/3a90b66dd211f4c4a2608837a4d550ace7a10f73)) (by [@luxass](https://github.com/luxass))
* add UCDStoreInvalidManifestError and improve error handling ([69d3d780](https://github.com/ucdjs/ucd/commit/69d3d780cddd8df93f6a03b4f4dc5ddac5de8e37)) (by [@luxass](https://github.com/luxass))
* enhance store initialization with dry-run mode and add tests ([4aee44b0](https://github.com/ucdjs/ucd/commit/4aee44b0cd9449df80e50bdd930ef50c64c8ebe7)) (by [@luxass](https://github.com/luxass))
* add analyze command for UCD store ([b22886ad](https://github.com/ucdjs/ucd/commit/b22886ade9f28bc6f0a8e54f29328376a0a53eec)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([9caa6a34](https://github.com/ucdjs/ucd/commit/9caa6a347138f2f3ec5ec20324c4bca82685ad68)) (by [@luxass](https://github.com/luxass))
* enhance CLI store command with version selection ([27db542d](https://github.com/ucdjs/ucd/commit/27db542d96bd9b9f4f64dcecdf0bad52ff864bf1)) (by [@luxass](https://github.com/luxass))
* add &#39;dev:api&#39; script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154)) (by [@luxass](https://github.com/luxass))
* implement shared flags and enhance store commands with clean, repair, and status functionalities ([333a90c6](https://github.com/ucdjs/ucd/commit/333a90c6ba18f528a8a646e1f95ecd57f8502303)) (by [@luxass](https://github.com/luxass))
* add store commands for clean, repair, status, and validate ([ed47d40a](https://github.com/ucdjs/ucd/commit/ed47d40a7e3b7dd4413c068469abc2cc1aec6474)) (by [@luxass](https://github.com/luxass))
* add store command ([0ba52fac](https://github.com/ucdjs/ucd/commit/0ba52fac19f587fc8428c07580424d7861fdc298)) (by [@luxass](https://github.com/luxass))
* add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058)) (by [@luxass](https://github.com/luxass))
* add HTML and README file exclusion options to download command ([36d1bc0e](https://github.com/ucdjs/ucd/commit/36d1bc0ee832e67f211613b0d962dc86a2b0fb3f)) (by [@luxass](https://github.com/luxass))
* enhance error reporting in download process and update exclusion patterns ([a5773700](https://github.com/ucdjs/ucd/commit/a5773700e2ce55ff3833e284c6a8b501d9f22588)) (by [@luxass](https://github.com/luxass))
* enable tsdown exports ([8d890cb3](https://github.com/ucdjs/ucd/commit/8d890cb3bea085a3fd12e818499ea305279a738a)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* change console method from info to log in help command test ([4b0cb662](https://github.com/ucdjs/ucd/commit/4b0cb6623a2496afdcab1174fc959938d39d6885)) (by [@luxass](https://github.com/luxass))
* improve mirror command ([27990106](https://github.com/ucdjs/ucd/commit/2799010628d9525988907cab4ade90b5e367fbfd)) (by [@luxass](https://github.com/luxass))
* handle include &amp; exclude as arrays ([ba7723f2](https://github.com/ucdjs/ucd/commit/ba7723f2fe6bca0ccf79170770bd5330908f8bd0)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils-old` to `@luxass/unicode-utils` ([b5d2405b](https://github.com/ucdjs/ucd/commit/b5d2405b9993896b207275e4b95b15f75dc872f3)) (by [@luxass](https://github.com/luxass))
* update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` ([46b62b64](https://github.com/ucdjs/ucd/commit/46b62b64395f76f1306e9abeeb42b43214ef4bc2)) (by [@luxass](https://github.com/luxass))
* improve error handling in store analysis ([c554d2ac](https://github.com/ucdjs/ucd/commit/c554d2acedb1939b4b17b7853ac81f568af83e4e)) (by [@luxass](https://github.com/luxass))
* print correct json output ([1807a7ce](https://github.com/ucdjs/ucd/commit/1807a7ce9a5daf696c7dcc6a67c688f7446907e5)) (by [@luxass](https://github.com/luxass))
* refactor version selection logic in runInitStore ([907a4106](https://github.com/ucdjs/ucd/commit/907a4106033953252b577db2ea80471edcc93c4d)) (by [@luxass](https://github.com/luxass))
* adjust argument indexing for store commands ([e7c8839d](https://github.com/ucdjs/ucd/commit/e7c8839dbd3e9b279c2e4f09a613c30291b8b4b9)) (by [@luxass](https://github.com/luxass))
* correct command argument indexing and improve process title ([d7446ff2](https://github.com/ucdjs/ucd/commit/d7446ff2c2e4b6ec470c4b8c6b9ff5b16cb28a04)) (by [@luxass](https://github.com/luxass))
* correct log message for analyzing versions ([8404d3bf](https://github.com/ucdjs/ucd/commit/8404d3bf46277df6e9330c88d8ec62bda076cead)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([3fabe8a0](https://github.com/ucdjs/ucd/commit/3fabe8a0c7b7205c59818ff59864a2dd2525c199)) (by [@luxass](https://github.com/luxass))
* handle version selection more robustly ([1aa8ea49](https://github.com/ucdjs/ucd/commit/1aa8ea49fd0c93964d8111324c642992a91f7a0b)) (by [@luxass](https://github.com/luxass))
* throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346)) (by [@luxass](https://github.com/luxass))
* remove proxyUrl from clean, init, repair, and status commands ([0499e047](https://github.com/ucdjs/ucd/commit/0499e0472b05928fa8aec4a99dc2cffacad511d5)) (by [@luxass](https://github.com/luxass))


## 0.3.0

### Minor Changes

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#66](https://github.com/ucdjs/ucd/pull/66) [`09fb839`](https://github.com/ucdjs/ucd/commit/09fb8396302428b395878110f9e593eacabae7b5) Thanks [@luxass](https://github.com/luxass)! - implement store command

- [#35](https://github.com/ucdjs/ucd/pull/35) [`a67a5b7`](https://github.com/ucdjs/ucd/commit/a67a5b75679dc8c4ba73743e5d6ffa2c18132439) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate cli to ucd-store download

### Patch Changes

- [#45](https://github.com/ucdjs/ucd/pull/45) [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31) Thanks [@luxass](https://github.com/luxass)! - unify filtering across stores

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- Updated dependencies [[`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f), [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31), [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946), [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f), [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea), [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0), [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12), [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e), [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/ucd-store@0.1.0
  - @ucdjs/schema-gen@0.2.2

## 0.2.2

### Patch Changes

- [#18](https://github.com/ucdjs/ucd/pull/18) [`24e8218`](https://github.com/ucdjs/ucd/commit/24e821845bf6a7b9c95b0db467b099440976c71c) Thanks [@luxass](https://github.com/luxass)! - feat: create comment files flag

## 0.2.1

### Patch Changes

- [#16](https://github.com/ucdjs/ucd/pull/16) [`846b18a`](https://github.com/ucdjs/ucd/commit/846b18a4ddf7c97062fc8367121809cd80950ab0) Thanks [@luxass](https://github.com/luxass)! - feat: add support for excluding draft in file download

## 0.2.0

### Minor Changes

- [#15](https://github.com/ucdjs/ucd/pull/15) [`24ce563`](https://github.com/ucdjs/ucd/commit/24ce563760b0efcf33ff9219d01868c195bb63ac) Thanks [@luxass](https://github.com/luxass)! - feat!: remove generate cmd in favor of the new download cmd

- [#13](https://github.com/ucdjs/ucd/pull/13) [`4e59266`](https://github.com/ucdjs/ucd/commit/4e592668e45fec9b15de0a1395708e694a9a8500) Thanks [@luxass](https://github.com/luxass)! - feat: add new download cmd

- [`381b40d`](https://github.com/ucdjs/ucd/commit/381b40d654c9c10d3c8b4f82bdeab3003b6a79d4) Thanks [@luxass](https://github.com/luxass)! - implement concurrency for codegen

### Patch Changes

- Updated dependencies [[`78f4673`](https://github.com/ucdjs/ucd/commit/78f4673657a210eb374a025dabe7450291712a0a)]:
  - @ucdjs/schema-gen@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`99eccc9`](https://github.com/ucdjs/ucd/commit/99eccc9bc76904e2e2b5c2233229857235841091)]:
  - @ucdjs/schema-gen@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`d55695d`](https://github.com/ucdjs/ucd/commit/d55695d16b6ec74953e2f2314500d70590eb5d1a)]:
  - @ucdjs/schema-gen@0.1.0

## 0.1.1

### Patch Changes

- [#3](https://github.com/ucdjs/ucd/pull/3) [`290e73d`](https://github.com/ucdjs/ucd/commit/290e73d29439c7102ead994f29b4d5797fb33eca) Thanks [@luxass](https://github.com/luxass)! - feat: enhance generate experience

## 0.1.0

### Minor Changes

- [#1](https://github.com/ucdjs/ucd/pull/1) [`bb3d880`](https://github.com/ucdjs/ucd/commit/bb3d880b8f824d5a2d7a9e0e627a94a6cc456355) Thanks [@luxass](https://github.com/luxass)! - feat: add generate cmd
