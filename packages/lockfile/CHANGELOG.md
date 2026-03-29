# @ucdjs/lockfile

## [0.1.1-beta.8](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.7...@ucdjs/lockfile@0.1.1-beta.8) (2026-03-29)


### 🚀 Features
* add inlinedDependencies for hookable package ([c1b2a55f](https://github.com/ucdjs/ucd/commit/c1b2a55f4cb5e71703b5a84039702c2500c16813)) (by [@luxass](https://github.com/luxass))
* add new pipeline implementations with logging and dependency handling ([879309e0](https://github.com/ucdjs/ucd/commit/879309e04dea4b0a92b5a341ab3fb3a0edc7d5ed)) (by [@luxass](https://github.com/luxass))
* migrate to tsdown v0.21 ([fc1276a9](https://github.com/ucdjs/ucd/commit/fc1276a9ed75073efe4fafc320ea6ed70801675a)) (by [@luxass](https://github.com/luxass))
* add inlineOnly configuration for hookable ([eae61f29](https://github.com/ucdjs/ucd/commit/eae61f29ce3512494dea611e618ed31bae03b184)) (by [@luxass](https://github.com/luxass))
* make @ucdjs/fs-bridge an optional peer dependency ([192bac0f](https://github.com/ucdjs/ucd/commit/192bac0faf8c1e6054b47e7c38b7d4ccecd7b00e)) (by luxass)
* add parse utilities that don&#39;t require a FS Bridge ([3d792f3a](https://github.com/ucdjs/ucd/commit/3d792f3a3658fa39951d150e511dc1e4491c4f7e)) (by luxass)

### 🐞 Bug Fixes
* move @ucdjs/fs-bridge to devDependencies only and reinstall ([a329758a](https://github.com/ucdjs/ucd/commit/a329758ac74cbc2743b2bd45c69e16d9148a55df)) (by luxass)
* address review comments - remove runtime fs-bridge import, extract parse helpers, fix null check, fix README signatures ([7323be7f](https://github.com/ucdjs/ucd/commit/7323be7f0d1e3e2dc19a80bdffdf125f448ecc9d)) (by luxass)
* replace example.com with ucdjs.dev and update lockfile after pnpm install ([beefecc8](https://github.com/ucdjs/ucd/commit/beefecc8a6bce2d4e6d3804112d6bb53801ce94d)) (by luxass)

### 📚 Documentation
* update README with usage examples and overview ([57bfa6c6](https://github.com/ucdjs/ucd/commit/57bfa6c6ab9d86b516147c28d34e443438c66c90)) (by [@luxass](https://github.com/luxass))


## [0.1.1-beta.7](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.6...@ucdjs/lockfile@0.1.1-beta.7) (2026-02-27)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.6...@ucdjs/lockfile@0.1.1-beta.7)


## [0.1.1-beta.6](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.5...@ucdjs/lockfile@0.1.1-beta.6) (2026-02-19)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.5...@ucdjs/lockfile@0.1.1-beta.6)


## [0.1.1-beta.5](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.4...@ucdjs/lockfile@0.1.1-beta.5) (2026-02-16)




### Notes

* No significant commits in this release.


## [0.1.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.3...@ucdjs/lockfile@0.1.1-beta.4) (2026-02-15)




### Notes

* No significant commits in this release.


## [0.1.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.2...@ucdjs/lockfile@0.1.1-beta.2) (2026-02-15)


### 🚀 Features
* update exports for hash and lockfile functions ([aa9687ee](https://github.com/ucdjs/ucd/commit/aa9687ee9abbbbfda0b0e48d1c7657eab4632837)) (by [@luxass](https://github.com/luxass))
* add tests for lockfile and snapshot creation ([2979832f](https://github.com/ucdjs/ucd/commit/2979832f750982ec6a32b156c2a524eb7e67e5bc)) (by [@luxass](https://github.com/luxass))
* add createdAt and updatedAt timestamps to lockfile entries ([62b10760](https://github.com/ucdjs/ucd/commit/62b107608111c54dd9d8ac4fae5cfaf96340dd13)) (by [@luxass](https://github.com/luxass))
* add validation for lockfile schema and improve error handling ([962e69eb](https://github.com/ucdjs/ucd/commit/962e69eb8102f9bd5634736f9951039d873e2bbb)) (by [@luxass](https://github.com/luxass))
* implement Unicode header stripping and hashing ([861e45ae](https://github.com/ucdjs/ucd/commit/861e45aee5eb8ad897dc8ce1bb806ffb7cb0f92c)) (by [@luxass](https://github.com/luxass))
* add @luxass/utils to devDependencies ([6efd4278](https://github.com/ucdjs/ucd/commit/6efd42785beff4019ae21e45e354f7bb429dafc5)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* introduce @ucdjs/lockfile package for lockfile and snapshot management ([f6a22412](https://github.com/ucdjs/ucd/commit/f6a22412368e1b1de17034cf16f5d1cd0d6a2126)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* allow setting filter in lockfile builder ([106d4c75](https://github.com/ucdjs/ucd/commit/106d4c758b7880c03fe0f78e6fee27ef07be59bf)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* check mkdir capability correctly in writeSnapshot ([dcf0722f](https://github.com/ucdjs/ucd/commit/dcf0722fa03b0e534b72fd749405c954376aa636)) (by [@luxass](https://github.com/luxass))
* update package.json to remove duplicate dependency entry for @ucdjs-internal/shared ([5bd7ea2f](https://github.com/ucdjs/ucd/commit/5bd7ea2f434ab24dad2dafc9b8175a8ca65746f1)) (by [@luxass](https://github.com/luxass))
## [0.1.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.1-beta.0...@ucdjs/lockfile@0.1.1-beta.1) (2026-02-15)


### 🚀 Features
* update exports for hash and lockfile functions ([aa9687ee](https://github.com/ucdjs/ucd/commit/aa9687ee9abbbbfda0b0e48d1c7657eab4632837)) (by [@luxass](https://github.com/luxass))
* add tests for lockfile and snapshot creation ([2979832f](https://github.com/ucdjs/ucd/commit/2979832f750982ec6a32b156c2a524eb7e67e5bc)) (by [@luxass](https://github.com/luxass))
* add createdAt and updatedAt timestamps to lockfile entries ([62b10760](https://github.com/ucdjs/ucd/commit/62b107608111c54dd9d8ac4fae5cfaf96340dd13)) (by [@luxass](https://github.com/luxass))
* add validation for lockfile schema and improve error handling ([962e69eb](https://github.com/ucdjs/ucd/commit/962e69eb8102f9bd5634736f9951039d873e2bbb)) (by [@luxass](https://github.com/luxass))
* implement Unicode header stripping and hashing ([861e45ae](https://github.com/ucdjs/ucd/commit/861e45aee5eb8ad897dc8ce1bb806ffb7cb0f92c)) (by [@luxass](https://github.com/luxass))
* add @luxass/utils to devDependencies ([6efd4278](https://github.com/ucdjs/ucd/commit/6efd42785beff4019ae21e45e354f7bb429dafc5)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* introduce @ucdjs/lockfile package for lockfile and snapshot management ([f6a22412](https://github.com/ucdjs/ucd/commit/f6a22412368e1b1de17034cf16f5d1cd0d6a2126)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* allow setting filter in lockfile builder ([106d4c75](https://github.com/ucdjs/ucd/commit/106d4c758b7880c03fe0f78e6fee27ef07be59bf)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* check mkdir capability correctly in writeSnapshot ([dcf0722f](https://github.com/ucdjs/ucd/commit/dcf0722fa03b0e534b72fd749405c954376aa636)) (by [@luxass](https://github.com/luxass))
* update package.json to remove duplicate dependency entry for @ucdjs-internal/shared ([5bd7ea2f](https://github.com/ucdjs/ucd/commit/5bd7ea2f434ab24dad2dafc9b8175a8ca65746f1)) (by [@luxass](https://github.com/luxass))


## [0.1.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/lockfile@0.1.0...@ucdjs/lockfile@0.1.1-beta.0) (2026-02-15)


### 🚀 Features
* update exports for hash and lockfile functions ([aa9687ee](https://github.com/ucdjs/ucd/commit/aa9687ee9abbbbfda0b0e48d1c7657eab4632837)) (by [@luxass](https://github.com/luxass))
* add tests for lockfile and snapshot creation ([2979832f](https://github.com/ucdjs/ucd/commit/2979832f750982ec6a32b156c2a524eb7e67e5bc)) (by [@luxass](https://github.com/luxass))
* add createdAt and updatedAt timestamps to lockfile entries ([62b10760](https://github.com/ucdjs/ucd/commit/62b107608111c54dd9d8ac4fae5cfaf96340dd13)) (by [@luxass](https://github.com/luxass))
* add validation for lockfile schema and improve error handling ([962e69eb](https://github.com/ucdjs/ucd/commit/962e69eb8102f9bd5634736f9951039d873e2bbb)) (by [@luxass](https://github.com/luxass))
* implement Unicode header stripping and hashing ([861e45ae](https://github.com/ucdjs/ucd/commit/861e45aee5eb8ad897dc8ce1bb806ffb7cb0f92c)) (by [@luxass](https://github.com/luxass))
* add @luxass/utils to devDependencies ([6efd4278](https://github.com/ucdjs/ucd/commit/6efd42785beff4019ae21e45e354f7bb429dafc5)) (by [@luxass](https://github.com/luxass))
* update dependencies and enhance lockfile path handling ([7d925743](https://github.com/ucdjs/ucd/commit/7d925743b4da3627aef7d4dccc8334f3a786ae53)) (by [@luxass](https://github.com/luxass))
* introduce @ucdjs/lockfile package for lockfile and snapshot management ([f6a22412](https://github.com/ucdjs/ucd/commit/f6a22412368e1b1de17034cf16f5d1cd0d6a2126)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* allow setting filter in lockfile builder ([106d4c75](https://github.com/ucdjs/ucd/commit/106d4c758b7880c03fe0f78e6fee27ef07be59bf)) (by [@luxass](https://github.com/luxass))
* try to ensure correct lockfile generation ([92188aee](https://github.com/ucdjs/ucd/commit/92188aee11223387769341ed7282badfe1157572)) (by [@luxass](https://github.com/luxass))
* check mkdir capability correctly in writeSnapshot ([dcf0722f](https://github.com/ucdjs/ucd/commit/dcf0722fa03b0e534b72fd749405c954376aa636)) (by [@luxass](https://github.com/luxass))
* update package.json to remove duplicate dependency entry for @ucdjs-internal/shared ([5bd7ea2f](https://github.com/ucdjs/ucd/commit/5bd7ea2f434ab24dad2dafc9b8175a8ca65746f1)) (by [@luxass](https://github.com/luxass))
