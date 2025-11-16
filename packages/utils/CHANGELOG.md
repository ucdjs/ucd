# @ucdjs/utils

## [0.3.0](https://github.com/ucdjs/ucd/compare/@ucdjs/utils@0.2.0...@ucdjs/utils@0.3.0) (2025-11-16)

### Features

* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(fs-bridge): add HTTP and Node file system bridges with comprehensive tests ([5bc90ebc](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f))
* feat(fs-bridge): implement recursive directory listing in HTTPFileSystemBridge ([b3ee5dd3](https://github.com/ucdjs/ucd/commit/b3ee5dd3165c3d96166c895afae773f020374f10))
* feat(fs-bridge): enhance listdir functionality with recursive support ([7db08f77](https://github.com/ucdjs/ucd/commit/7db08f7739fcfb92b5594a468a0735afe716e930))
* feat(utils): add flattenFilePaths function to recursively flatten file structures ([da32ab48](https://github.com/ucdjs/ucd/commit/da32ab48388d9c88f57af22e080bd0933e5212ca))
* feat(ucd-store): add tests for mirrorUCDFiles and validateUCDFiles functions ([3214f78e](https://github.com/ucdjs/ucd/commit/3214f78eeb246cdf86799834e8993c0ca4f98d9e))
* feat(env): add environment package with configuration and validation utilities ([2743f549](https://github.com/ucdjs/ucd/commit/2743f549a6fa4d0fc779c573bee0ef3529a4bae3))
* feat(proxy): add utility dependencies and improve error handling ([39eca3dc](https://github.com/ucdjs/ucd/commit/39eca3dcefd037aef240cf54ab48f4e2d054d057))
* feat(fetch): initialize fetch package with API client and documentation ([c4ec17fd](https://github.com/ucdjs/ucd/commit/c4ec17fd2fab890eb42c79a80bb5c5418c4fb19a))
* feat(cli): add 'dev:api' script for API development ([b9c3b2ba](https://github.com/ucdjs/ucd/commit/b9c3b2ba3b0744409c6b31b46c4a3d0393e97154))
* feat(utils): add constants for Unicode and UCDJS API URLs ([63b468f9](https://github.com/ucdjs/ucd/commit/63b468f95555ac8049c0c2f5f9b0476c7a5447a9))
* feat(filter): enhance `PathFilterFn` to accept additional filters ([d9cf1fc6](https://github.com/ucdjs/ucd/commit/d9cf1fc67d5dd87793d6ffbc9de15dcc89996f14))
* feat(filter): enhance path filter functionality ([b1929622](https://github.com/ucdjs/ucd/commit/b19296220de3ad86b80c8f209591751944594806))
* feat(fs-bridge): update rm method to default to non-recursive and non-force ([6ad0a2c2](https://github.com/ucdjs/ucd/commit/6ad0a2c2e2e249bda32adafdaf395cd111d1679e))
* feat(utils): add comprehensive tests for HTTPFileSystemBridge ([58d9abe8](https://github.com/ucdjs/ucd/commit/58d9abe835f6faa329c10c54c0ee7af3b01add9f))
* feat(utils): enhance HTTPFileSystemBridge with new methods ([5ac936b2](https://github.com/ucdjs/ucd/commit/5ac936b28b62ccd9b579dfb492bb66683cde028a))
* feat(utils): implement Node.js file system operations ([f9c79acf](https://github.com/ucdjs/ucd/commit/f9c79acff0421d045d3b0ab264c23149bf8614c5))
* feat(utils): extend FileSystemBridge interface with new methods ([778da095](https://github.com/ucdjs/ucd/commit/778da0952a069895cca2093d8270034f05be5928))
* feat: add new fs impl ([8a09ff29](https://github.com/ucdjs/ucd/commit/8a09ff29cd76e6716951b4e37802605f3b886836))
* feat: add new vfs module ([3bf85d86](https://github.com/ucdjs/ucd/commit/3bf85d8635b539a613d7df79b7b27b1a6fb91b75))
* feat: add optional proxy URL to MirrorOptions and internal functions ([3292668c](https://github.com/ucdjs/ucd/commit/3292668cc95891c5fcbca98218f404bfd36ff551))
* feat: enhance validateUCDFiles to filter out directories and update test to reflect changes ([ef300d36](https://github.com/ucdjs/ucd/commit/ef300d362431912f2d5489736318e6f6adb6f0f8))
* feat: update readdir method to support recursive option and modify validateUCDFiles to handle directories ([30e5440e](https://github.com/ucdjs/ucd/commit/30e5440ecef3f45261f5dbdfa861590769d2a747))
* feat: update validateUCDFiles to return missing and not required files ([605ff972](https://github.com/ucdjs/ucd/commit/605ff9729d174766aedeaa0bf9535d220cfb8911))
* feat: add TODO to validateUCDFiles for returning extra files ([95d54a2c](https://github.com/ucdjs/ucd/commit/95d54a2c177320d1c03e52698f6d7907dbe4b965))
* feat: add validateUCDFiles function and update FSAdapter interface with exists and readdir methods ([470abb64](https://github.com/ucdjs/ucd/commit/470abb640a60801142e7e75f960d5783f0f767e0))
* feat: enhance mirrorUCDFiles to handle errors and return located files ([febe7ab6](https://github.com/ucdjs/ucd/commit/febe7ab67c2ba9853164182f1340cf964c8b8453))
* feat: enhance mirrorUCDFiles to handle errors and return located files ([b7e05f61](https://github.com/ucdjs/ucd/commit/b7e05f614b82929fce7b08eb586d0d379dcfdd4a))
* feat: enhance mirrorUCDFiles with pattern matching and error handling ([73c02513](https://github.com/ucdjs/ucd/commit/73c02513ba0fd8f6e62500bc954313e36cf37490))
* feat: add dependencies for unicode utilities and defu in package.json and pnpm-lock.yaml ([b7e31ff9](https://github.com/ucdjs/ucd/commit/b7e31ff9f734180bf439defbc6f942c124295f49))
* feat: implement mirrorUCDFiles ([119a25b9](https://github.com/ucdjs/ucd/commit/119a25b9210e68271a0565155a13335844a0ec5d))
* feat: add UCD file mirroring utilities and filesystem adapter ([e85bdbde](https://github.com/ucdjs/ucd/commit/e85bdbde6df5aaca29f214b943fbd85c53605ca3))
* feat: add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json ([48dad498](https://github.com/ucdjs/ucd/commit/48dad4988f63c50f2c878f310112cf0fd44e6058))

### Bug Fixes

* fix(utils): ensure 'entries' is an array before processing ([54af41b9](https://github.com/ucdjs/ucd/commit/54af41b92e2849e1b5eae3d39296ab733af21418))
* fix(fs-bridge): set default baseUrl for HTTPFileSystemBridge ([0a699f21](https://github.com/ucdjs/ucd/commit/0a699f210b8eb60666773c8ec6d33db9cbc348cd))
* fix(fs-bridge): ensure baseUrl is always defined ([0753a323](https://github.com/ucdjs/ucd/commit/0753a323055c91fc41f682b61a7ea0d98c6297da))
* fix(flatten): correct file path handling in flattenFilePaths function ([91aff454](https://github.com/ucdjs/ucd/commit/91aff45407699502d55c352a8dbe8b0d9a18eb6e))
* fix(utils): update predefined filter patterns for exclusions ([c39fa797](https://github.com/ucdjs/ucd/commit/c39fa797388ee47812dffa05601a1b9666d1a388))
* fix(utils): update listdir to return file names and enhance recursive listing ([f4f97aca](https://github.com/ucdjs/ucd/commit/f4f97acaba21c7dbb3958496ab4773cc98873491))
* fix: throw if unresolved import ([8123dda2](https://github.com/ucdjs/ucd/commit/8123dda281a62ed6bd63c6d1b6975a27a6f78346))
* fix(tests): update API URLs in mirror and validate test files to use UCDJS_API_BASE_URL ([8c7678e3](https://github.com/ucdjs/ucd/commit/8c7678e35659fcab55c2c6f5df05fa86aa2bac3c))
* fix(tests): update API URLs in test files ([9dff312a](https://github.com/ucdjs/ucd/commit/9dff312a4ef4cdfeb26e6a263dc399eb07e1eb7f))
* fix(utils): use UNICODE_PROXY_URL as default base URL ([a26f9757](https://github.com/ucdjs/ucd/commit/a26f975776218e6db3b64c3e5a3036fd05f75ebd))
* fix(constants): update default Unicode API base URL ([2415c8e1](https://github.com/ucdjs/ucd/commit/2415c8e121fb7c1563371fac1a8e60f48be46362))
* fix(constants): handle process.env safely in constants file ([1dca07f2](https://github.com/ucdjs/ucd/commit/1dca07f28c2bc5c95c5aa017562405a00b6a3c51))
* fix: correct mock reset method in validate test and add ucd-files to hidden logs ([6807b611](https://github.com/ucdjs/ucd/commit/6807b611919224970467a0c4c6e64a98c3a622c8))

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
* chore: fix ([ec3a473b](https://github.com/ucdjs/ucd/commit/ec3a473b80329a6399cbb7fac90b319c1431153e))
* refactor: migrate `flattenFilePaths` imports from `@ucdjs/utils` to `@ucdjs/shared` ([49318725](https://github.com/ucdjs/ucd/commit/49318725c45c27dad6354ff4b0faf6bc4da795fa))
* refactor: remove flatten utility and related tests ([4db6f390](https://github.com/ucdjs/ucd/commit/4db6f3909d2ea8fe3d67c5bd149c9635169174ea))
* refactor(shared, utils): move `safeJsonParse` function to shared package ([ee893aa4](https://github.com/ucdjs/ucd/commit/ee893aa4b3ab8e8aac3ed85ad1b87ea0e0ca3a91))
* docs(utils): enhance createPathFilter documentation with detailed examples ([f0308f87](https://github.com/ucdjs/ucd/commit/f0308f87cc02bd05533b59430a7892b8a40e0f22))
* chore: update dependencies ([c813c448](https://github.com/ucdjs/ucd/commit/c813c4481eb3fb7b92ce728cc1b09f99b9c8a7fc))
* chore: update build scripts to include custom TypeScript configuration ([ef9cf9a5](https://github.com/ucdjs/ucd/commit/ef9cf9a5e59990c4d310e92b5643648f9feecdd0))
* test(ucd-store): integrate `memfs` for enhanced filesystem operations ([1b539ab2](https://github.com/ucdjs/ucd/commit/1b539ab2b8c4511c446ed41114b850f5350358e7))
* Merge branch 'main' into store-analyze ([ea3b7f74](https://github.com/ucdjs/ucd/commit/ea3b7f7451e1d658d3adbcb8e01983111a37cfa9))
* chore: lint ([8a493ed9](https://github.com/ucdjs/ucd/commit/8a493ed93181d340c9afadfb1fbe08a6c6dadd48))
* chore(eslint): refactor ESLint configuration across multiple packages ([4924a4c8](https://github.com/ucdjs/ucd/commit/4924a4c8d1d1296fa6717b278e695d05450b2f5a))
* chore(tsconfig): standardize include and exclude patterns across configurations ([4ddbf590](https://github.com/ucdjs/ucd/commit/4ddbf590eb8bdabf6de5a3b532ec5a07aefd5ea9))
* chore: remove old schemas ([06c43985](https://github.com/ucdjs/ucd/commit/06c439858a7fb6845bb1678a18d15eba398c5403))
* chore: lint ([7cd534bc](https://github.com/ucdjs/ucd/commit/7cd534bce6baa519c395845f348879c84189fe68))
* chore: dump ([a68343b2](https://github.com/ucdjs/ucd/commit/a68343b22d1634ff616f8b74c851574352eefb3a))
* refactor(fs-bridge): update listdir return type to FSEntry[] ([ef8651d0](https://github.com/ucdjs/ucd/commit/ef8651d01b1e8791c785c004f73f3ac2b2bff4e6))
* test(fs-bridge): add comprehensive tests for HTTPFileSystemBridge operations ([0d036046](https://github.com/ucdjs/ucd/commit/0d03604605d9f37ad2915734ba331edac3a817f8))
* refactor(fs-bridge): enhance write operation to create parent directories ([793b0b1c](https://github.com/ucdjs/ucd/commit/793b0b1c1ec890c9f11d6e3a9c4cd1e14b0a9160))
* refactor(fs-bridge): remove unused `getSupportedBridgeCapabilities` function ([1d559db3](https://github.com/ucdjs/ucd/commit/1d559db3584fa74c2780a3de7271002bd26f709c))
* test(fs-bridge): add comprehensive tests for defineFileSystemBridge ([505086fc](https://github.com/ucdjs/ucd/commit/505086fc093e4c30bfa4be6f1133e3603334f917))
* refactor(fs-bridge): enhance type safety in FileSystemBridge interfaces ([e333dd24](https://github.com/ucdjs/ucd/commit/e333dd24edbdc2c775591747522645deec88dce8))
* refactor(fs-bridge): improve type safety and structure of file system bridge interfaces ([12673785](https://github.com/ucdjs/ucd/commit/12673785beae6ea87d4f3f915069740ccff5d1a3))
* refactor(fs-bridge): enhance HTTP and Node file system bridge implementations ([da79ce61](https://github.com/ucdjs/ucd/commit/da79ce61e5aed26586e20a2c87873db864eec57b))
* refactor(fs-bridge): simplify interface and enhance type safety ([c784e16e](https://github.com/ucdjs/ucd/commit/c784e16e8fc75448bec3cfccd471b9330a292b0c))
* test: remove obsolete HTTP and Node file system bridge tests ([587dd435](https://github.com/ucdjs/ucd/commit/587dd43505a0ee7ff99dc2a608fad7db947c92c6))
* refactor(store): update file tree types and import flattenFilePaths from utils ([c3cb6344](https://github.com/ucdjs/ucd/commit/c3cb6344d227a8c49883f942ba668c09a0677e7d))
* test(utils): enhance UnicodeTree structure in flattenFilePaths tests ([0e8b8863](https://github.com/ucdjs/ucd/commit/0e8b886307956cf1efa4517513f2992490644adc))
* refactor: rename FileTreeNode to UnicodeTreeNode and update related schemas ([7f366e53](https://github.com/ucdjs/ucd/commit/7f366e531644413e4701a4ceab7f7b579eecade4))
* refactor(api): update type references in flatten functions ([85d91251](https://github.com/ucdjs/ucd/commit/85d91251f81e3a0002fe57b74954a21f17449188))
* chore: update msw utils ([1b01b219](https://github.com/ucdjs/ucd/commit/1b01b2199e77cce324c08e62b80faf90fd2c7b90))
* chore: update node engine version across packages ([315a422d](https://github.com/ucdjs/ucd/commit/315a422d589bf277cb99cd313a693baed973da75))
* chore: update dependencies ([a1d2a3a7](https://github.com/ucdjs/ucd/commit/a1d2a3a7638baf44d4b03062b0070ba7bf7e0222))
* docs(utils): update README to enhance usage examples and clarify functionality ([82a55e1c](https://github.com/ucdjs/ucd/commit/82a55e1c4f87ced174802e0ac73ceb6364e48544))
* chore: update package versions in pnpm-workspace.yaml ([9dde454c](https://github.com/ucdjs/ucd/commit/9dde454c84169dcb5a6fc5b82215602fc0a8c243))
* chore: add Codecov configuration and badges to documentation ([e18b6d02](https://github.com/ucdjs/ucd/commit/e18b6d02442f93afa055a0956ce5df69b70bba77))
* test(utils): enhance directory listing tests and add stat operation validation ([eb6ccf00](https://github.com/ucdjs/ucd/commit/eb6ccf00a038b0a7d3e1f98f9372971a6e8f0eba))
* chore: format ([edd17fb7](https://github.com/ucdjs/ucd/commit/edd17fb7a40d270a1b9dd3ae1cb6b2ae83aca815))
* chore: refactor tsdown configuration across packages ([323318de](https://github.com/ucdjs/ucd/commit/323318def2095643c3062fb863c78f1942ac1516))
* chore: fix ([61a85457](https://github.com/ucdjs/ucd/commit/61a854573cfa26c0ccb6f55e2de38be1715a6bc8))
* chore: update Unicode API references and dependencies ([17ee2ee9](https://github.com/ucdjs/ucd/commit/17ee2ee9d47ad56c1d05bd7e7cb0250bf53719f9))
* Merge remote-tracking branch 'origin/main' into improve-store ([be872aa4](https://github.com/ucdjs/ucd/commit/be872aa40a651eb5b2fabfd615e250b07b5a0ffc))
* chore: update pnpm workspace configuration ([e0f3343e](https://github.com/ucdjs/ucd/commit/e0f3343ea1cb513b00c4d8921c8135d2118a4b35))
* Merge branch 'main' into improve-store ([c79c1d89](https://github.com/ucdjs/ucd/commit/c79c1d89b260b35d9d495c594766d18b8041ed4b))
* refactor(store): update default base URL for remote store ([add5c0a7](https://github.com/ucdjs/ucd/commit/add5c0a7badfbe2e13d0a8bf20c02782ed0462fe))
* refactor(store): streamline store initialization and manifest handling ([de5eb013](https://github.com/ucdjs/ucd/commit/de5eb013c1c4d1f9634ef81c934dd538b267c73f))
* test(filter): add support for `extraFilters` parameter in `createPathFilter` ([2dd5f6f5](https://github.com/ucdjs/ucd/commit/2dd5f6f54a1eae04c60ebc37946c00d1a55cf52f))
* refactor(utils): update `PathFilter` methods for improved filter management ([64e60659](https://github.com/ucdjs/ucd/commit/64e606598e497f67d8fd059e076a88f7fe406c15))
* chore(utils): remove `fs-extra` dependency and update documentation ([a824e6f7](https://github.com/ucdjs/ucd/commit/a824e6f7f1fbff865d9637426d85aae9528fdbf8))
* refactor(store): update filter type and enhance file retrieval methods ([cf7f7b1d](https://github.com/ucdjs/ucd/commit/cf7f7b1d185a56c0e59f78bbac412d2305ba7439))
* refactor(store): replace hardcoded URLs with constants and improve store initialization ([3ea42a18](https://github.com/ucdjs/ucd/commit/3ea42a18899b4820df7672c0e37b8387e90fcf20))
* refactor(store): unify UCDStore implementation and remove legacy classes ([5a9bea8d](https://github.com/ucdjs/ucd/commit/5a9bea8df2883ee00e5c6d79d44532b857737208))
* refactor: remove local and remote UCD store implementations ([29f0f599](https://github.com/ucdjs/ucd/commit/29f0f599b53782a13ce97445135a738fa7f1901d))
* test(utils): enhance custom pattern matching using createPathFilter ([5f892755](https://github.com/ucdjs/ucd/commit/5f8927559cd5efe0ef678322879586e555bbc2e1))
* test(utils): extend functionality to support dynamic filter patterns ([5af9d48d](https://github.com/ucdjs/ucd/commit/5af9d48db5a60dd0f5e6de5df7c28755222dfd74))
* chore: fix type ([2b72813b](https://github.com/ucdjs/ucd/commit/2b72813bdc6e3d5d8d42e547a55e3beaf2ee7bc8))
* chore: enhance type definitions for ensureDir, mkdir, stat, and rm methods in FSAdapter ([b014429a](https://github.com/ucdjs/ucd/commit/b014429a298f63bbd4457f228007c894c6877d17))
* chore: refactor createFileSystem and improve Node.js adapter handling ([c30a3720](https://github.com/ucdjs/ucd/commit/c30a3720283704ccb3788253048cc17c7970d4bb))
* chore: remove deprecated memfs-node adapter and update file system handling ([4d841493](https://github.com/ucdjs/ucd/commit/4d841493a535cb41324402ad85a052ffbaafa929))
* chore: lint ([91e99158](https://github.com/ucdjs/ucd/commit/91e9915807d970e74d940d7fd16c08d4516eeb56))
* chore: refactor FSAdapter methods and improve type definitions ([6772faad](https://github.com/ucdjs/ucd/commit/6772faad1d9403f2fa8b9c9bac156044dc90929e))
* chore: refactor file system adapter and update exports ([bff2921c](https://github.com/ucdjs/ucd/commit/bff2921c0b405d0061fbb7e63f7e7488e1fa44a7))
* chore: apply coderabbit suggestion ([b23f96ce](https://github.com/ucdjs/ucd/commit/b23f96ce725e11467dbc09bbd8d75097b0621e39))
* chore: apply coderabbit suggestion ([dc8bd217](https://github.com/ucdjs/ucd/commit/dc8bd217d18cacc33a8107ca311d285d3d603988))
* chore: apply coderabbit suggestion ([8661ad53](https://github.com/ucdjs/ucd/commit/8661ad53634882ed3f7a163c13c185a1171f90d9))
* chore: apply coderabbit suggestion ([5f4e1e01](https://github.com/ucdjs/ucd/commit/5f4e1e01c3421556d337383ce3cb0f88308fbdde))
* chore: add more tests ([1c276083](https://github.com/ucdjs/ucd/commit/1c276083684b987a0a48845890a7705ba89d536a))
* chore: lint ([fa61a58b](https://github.com/ucdjs/ucd/commit/fa61a58b4a53a2da058748dbc949cea5adfc4160))
* refactor: remove deprecated FsInterface tests and related code; implement repairUCDFiles functionality with improved error handling and file downloading logic ([9d37fafe](https://github.com/ucdjs/ucd/commit/9d37fafe0ba0d4fef419d1b43717634d58191166))
* refactor: remove FsInterface and related functions; update download logic to use buildUCDPath ([d3ee25dc](https://github.com/ucdjs/ucd/commit/d3ee25dc3c9dc22242f1ed4485047f3bc0cd7eba))
* refactor: replace internal flattening function with helper utility ([3610c72d](https://github.com/ucdjs/ucd/commit/3610c72da013d2a5819f5343159b72899a863e83))
* refactor: migrate ucd-store to use utils ([cadc55b4](https://github.com/ucdjs/ucd/commit/cadc55b4238f8fb99e82a84a2047a34fd693ca38))
* refactor: replace hardcoded proxy URL with configurable option in internal__processEntries ([f03d9ff2](https://github.com/ucdjs/ucd/commit/f03d9ff25df5e0023da7da95c27a134474d56792))
* test: update missing files assertion to use arrayContaining and check length ([1bc63d64](https://github.com/ucdjs/ucd/commit/1bc63d64febd22b610b6cc5a08f23b0a33a79e64))
* chore: use path.join ([1588f6ea](https://github.com/ucdjs/ucd/commit/1588f6ea24a9d1a5722557843138095c7abd90de))
* refactor: improve documentation for validateUCDFiles function ([4c713242](https://github.com/ucdjs/ucd/commit/4c713242fce9bda8c52fd7166fd644ffac4319d1))
* chore: add comment ([26fc64c6](https://github.com/ucdjs/ucd/commit/26fc64c6bac83b15bd570f776d8cec21992d82b1))
* refactor: ucd-files impl ([b1d799a4](https://github.com/ucdjs/ucd/commit/b1d799a44bb6f4fb5efe53836586e12df718128f))
* chore: fix tests ([fb783972](https://github.com/ucdjs/ucd/commit/fb7839726650c4ec55879e9cfd2b13c04a5b6fc8))
* chore: fix fs initialization ([a1465f7f](https://github.com/ucdjs/ucd/commit/a1465f7f46a4a6937cc4b4bd6eca548cabb6a900))
* chore: add basePath to mirrorUCDFiles tests for custom API URL and pattern matching ([1ab7027c](https://github.com/ucdjs/ucd/commit/1ab7027cc5616fc509a3318a8297206752127d6a))
* chore: apply coderabbit suggestion ([372f8cd6](https://github.com/ucdjs/ucd/commit/372f8cd6355f3066c45e5aacce2857ab0bd4a000))
* chore: fix types ([7c3d3392](https://github.com/ucdjs/ucd/commit/7c3d33921e252fd588b76369100a11342bbc2357))
* chore: fix test ([ff9bcc24](https://github.com/ucdjs/ucd/commit/ff9bcc248f98deb64d2c38c60ab9e02a5c6199ad))
* chore: lint ([b91fe9ad](https://github.com/ucdjs/ucd/commit/b91fe9ad60530b343923097e85db737f9f2d3779))
* test: add comprehensive tests for mirroring ([7da86225](https://github.com/ucdjs/ucd/commit/7da86225813e1b24a4c1389557e85d6a8bf4ccbf))
* chore: lint ([d87c362c](https://github.com/ucdjs/ucd/commit/d87c362ccf28c51ab530c09cc981dcff07bfc90b))
* refactor: simplify createDefaultFSAdapter and add tests for FS adapter ([3fccaf55](https://github.com/ucdjs/ucd/commit/3fccaf55b4ced89c0f31a4869e630c8b173023b4))
* refactor: move filter functionality from ucd-store to utils package ([98b84b07](https://github.com/ucdjs/ucd/commit/98b84b07af8c09a3b8881af95a5fdf99d4afb52e))
* chore: migrate to use tooling packages ([5b7cf43a](https://github.com/ucdjs/ucd/commit/5b7cf43aff5bba0701cda7043106f83b94082c39))
* chore: update dependencies ([f262f3fc](https://github.com/ucdjs/ucd/commit/f262f3fc69d223097368fd8b69636225c4e983da))


## 0.2.0

### Minor Changes

- [#212](https://github.com/ucdjs/ucd/pull/212) [`9ea1f81`](https://github.com/ucdjs/ucd/commit/9ea1f81ac649d06b8290edc0db0eb049988073fe) Thanks [@luxass](https://github.com/luxass)! - BREAKING: Remove most exports from @ucdjs/utils package

  Most utility functions have been moved to the internal `@ucdjs-internal/shared` package to better organize the monorepo's internal utilities. If you were using any of the removed functions, you can install `@ucdjs-internal/shared` directly, but note that this package is internal and may change without being marked as breaking changes.

  The `@ucdjs/utils` package now focuses on stable, user-facing utilities only.

- [#116](https://github.com/ucdjs/ucd/pull/116) [`4cb4b05`](https://github.com/ucdjs/ucd/commit/4cb4b0516173db402ee77d2ce1e9ed4e1923b359) Thanks [@luxass](https://github.com/luxass)! - feat: add `flattenFilePaths`

- [#68](https://github.com/ucdjs/ucd/pull/68) [`31f9791`](https://github.com/ucdjs/ucd/commit/31f9791d1775055cbc4794a2e923fd08713fc395) Thanks [@luxass](https://github.com/luxass)! - feat(utils): introduce `createFileSystem` factory + `FSAdapter` interface providing in-memory and custom VFS support

- [#59](https://github.com/ucdjs/ucd/pull/59) [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab) Thanks [@luxass](https://github.com/luxass)! - refactor: migrate ucd-store to use utils

- [#71](https://github.com/ucdjs/ucd/pull/71) [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c) Thanks [@luxass](https://github.com/luxass)! - Merge LocalUCDStore & RemoteUCDStore into a single UCDStore class which handles everything. Since we are using the new fs-bridge exposed from `@ucdjs/utils` we can easily do this.

- [#49](https://github.com/ucdjs/ucd/pull/49) [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af) Thanks [@luxass](https://github.com/luxass)! - move filter's to utils pkg

- [#72](https://github.com/ucdjs/ucd/pull/72) [`731283e`](https://github.com/ucdjs/ucd/commit/731283e1eb5fdb3178ba4ce4c1713af3246b5955) Thanks [@luxass](https://github.com/luxass)! - feat(utils): enhance path filter functionality

  - Introduced `extend` and `patterns` methods to `PathFilter` for dynamic filter management.
  - Updated `createPathFilter` to return a `PathFilter` instead of a function type.
  - Refactored type references in related modules to use `PathFilter`.

- [#53](https://github.com/ucdjs/ucd/pull/53) [`8cd9a4c`](https://github.com/ucdjs/ucd/commit/8cd9a4c8a65128b142dccad1c532ef79c6fcbbc4) Thanks [@luxass](https://github.com/luxass)! - implement mirrorUCDFiles

- [#56](https://github.com/ucdjs/ucd/pull/56) [`7cc3df9`](https://github.com/ucdjs/ucd/commit/7cc3df9b6bde24fc0bc758e179e1169bb9003496) Thanks [@luxass](https://github.com/luxass)! - refactor ucd-files

- [#76](https://github.com/ucdjs/ucd/pull/76) [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9) Thanks [@luxass](https://github.com/luxass)! - improve store

- [#96](https://github.com/ucdjs/ucd/pull/96) [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03) Thanks [@luxass](https://github.com/luxass)! - move @ucdjs/utils/ucd-files into @ucdjs/ucd-store/ucd-files

- [#50](https://github.com/ucdjs/ucd/pull/50) [`cc16dd3`](https://github.com/ucdjs/ucd/commit/cc16dd3f4af7a78ced58d74f7f3a265fc75af9a4) Thanks [@luxass](https://github.com/luxass)! - implement fs-adapter for usage in mirrorUCDFiles

- [#75](https://github.com/ucdjs/ucd/pull/75) [`59dee88`](https://github.com/ucdjs/ucd/commit/59dee88baa6ab3ce936ef293c4733dc8a8d2fe26) Thanks [@luxass](https://github.com/luxass)! - feat: export constants

- [#55](https://github.com/ucdjs/ucd/pull/55) [`99ac908`](https://github.com/ucdjs/ucd/commit/99ac908c0f8c79ddb214661da3888b07b725cd69) Thanks [@luxass](https://github.com/luxass)! - feat: add validateUCDFiles function and update FSAdapter interface with exists and readdir methods

- [#74](https://github.com/ucdjs/ucd/pull/74) [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55) Thanks [@luxass](https://github.com/luxass)! - Enhanced path filtering with extendable filters and temporary filter support.

  ```typescript
  const filter = createPathFilter(["*.txt"]);
  filter.extend(["!*Test*"]); // Add more patterns
  filter("file.js", ["*.js"]); // Use extra filters temporarily
  ```

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0

## 0.1.0

### Minor Changes

- [#29](https://github.com/ucdjs/ucd/pull/29) [`11095da`](https://github.com/ucdjs/ucd/commit/11095da0d51bfc3b1ca3a5a23d2b826e3c5e2fd3) Thanks [@luxass](https://github.com/luxass)! - feat: add safe json parse
