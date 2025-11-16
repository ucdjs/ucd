# @ucdjs/path-utils

## [0.2.0](https://github.com/ucdjs/ucd/compare/@ucdjs/path-utils@0.1.0...@ucdjs/path-utils@0.2.0) (2025-11-16)

### Features

* feat(shared): migrate utilities to @ucdjs-internal/shared ([4d7588fd](https://github.com/ucdjs/ucd/commit/4d7588fde6943006a59e89fc8338dc0078f347a9))
* feat(path-utils): enhance path security and handling ([cf82cd37](https://github.com/ucdjs/ucd/commit/cf82cd37e6b631a7e8e13fee6b29292b3954fde9))
* feat(path-utils): enhance Windows path handling and validation ([1d04aeb1](https://github.com/ucdjs/ucd/commit/1d04aeb1e209aaa257ef62a1479ca87a1790afb8))
* feat(path-utils): export osPlatform for platform detection ([c94f9254](https://github.com/ucdjs/ucd/commit/c94f925406e9ff18c874cc3c6363ca7dc414411a))
* feat(path-utils): add WindowsPathBehaviorNotImplementedError for unimplemented behavior ([7cb4681b](https://github.com/ucdjs/ucd/commit/7cb4681b52a29e9e8e76b9660b88786f7c9aa90c))
* feat(path-utils): add isWindowsDrivePath and stripDriveLetter functions ([a1104df4](https://github.com/ucdjs/ucd/commit/a1104df47258b28a2ee93cf8eec0c467701346a3))
* feat(path-utils): enhance path resolution with error handling and validation ([b28fc513](https://github.com/ucdjs/ucd/commit/b28fc5132b849deb0e8880d16934235ed61ec6fc))
* feat(path-utils): add resolveSafePath function for path resolution and traversal prevention ([3bf4cbb5](https://github.com/ucdjs/ucd/commit/3bf4cbb542742b27dc8c0e60df1dc241891d0b44))
* feat(path-utils): add toUNCPosix function for converting Windows UNC paths to POSIX format ([47bb83cb](https://github.com/ucdjs/ucd/commit/47bb83cbe18cfbf780b8e663f8ae0ac301dab08a))
* feat(path-utils): add getAnyUNCRoot function and reorganize imports ([b0595d86](https://github.com/ucdjs/ucd/commit/b0595d86f17e0251bcc89747d667072f28dd8dd7))
* feat(path-utils): add constants for Windows path handling and enhance path conversion ([2dc9e07c](https://github.com/ucdjs/ucd/commit/2dc9e07c61f9063950b282ec332bc9b9cd417f8f))
* feat(path-utils): add missing error exports for path utilities ([83b38b51](https://github.com/ucdjs/ucd/commit/83b38b51584619f07f14c1463ab598544f9062de))
* feat(path-utils): add custom error classes for path traversal and Windows path issues ([ff098b7d](https://github.com/ucdjs/ucd/commit/ff098b7d9cf82f39633d09e4a37d76421a0834b0))
* feat(path-utils): add decodePathSafely function and update exports ([4070b806](https://github.com/ucdjs/ucd/commit/4070b806826546368f37b0f6ac1c41536b559efd))
* feat(path-utils): add custom error classes for path utilities ([044cd11d](https://github.com/ucdjs/ucd/commit/044cd11da10a88b9b03c276309c575b63981075e))
* feat(path-utils): add isWithinBase function for path validation ([974d929d](https://github.com/ucdjs/ucd/commit/974d929dbfcabaaf494376f222b3b247c09343c2))
* feat(path-utils): add isCaseSensitive utility ([11b4b5c1](https://github.com/ucdjs/ucd/commit/11b4b5c160261e22051592b264b7a0d87756413e))
* feat(path-utils): implement Windows path utilities ([09840fe5](https://github.com/ucdjs/ucd/commit/09840fe59d0c7171a770cda28050b26f959fea68))
* feat(path-utils): setup package ([f4e6cce5](https://github.com/ucdjs/ucd/commit/f4e6cce5864dc26efda2590f0882c8f3b58554d5))

### undefined

* refactor(tsdown-config): update package references to @ucdjs-tooling/tsdown-config ([ccc002da](https://github.com/ucdjs/ucd/commit/ccc002dafd139e0b08e55098470f7a2a8af361ab))
* refactor: update tsconfig references to use @ucdjs-tooling/tsconfig ([e5c39ac8](https://github.com/ucdjs/ucd/commit/e5c39ac8d2e0ad1cc4a29e4417013ed124c83801))
* refactor(path-utils): swap parameters for consistency ([2264cfa4](https://github.com/ucdjs/ucd/commit/2264cfa423e235ce6191ad58823d14439bf1dada))
* refactor(path-utils): remove unc support ([2c180272](https://github.com/ucdjs/ucd/commit/2c180272743923f156ce211c6a2e4cc845c5dfee))

### Bug Fixes

* fix(path-utils): normalize input path in resolveSafePath function ([49a4ccdd](https://github.com/ucdjs/ucd/commit/49a4ccdd750e5f1efe83f590dc372cf37ae06fa8))
* fix(path-utils): update CONTROL_CHARACTER_RE regex for accuracy ([6b4f43d9](https://github.com/ucdjs/ucd/commit/6b4f43d9dae6a5f8784d2b9123a4a3c87b88df24))
* fix(path-utils): improve path validation and normalization ([4ee30d5a](https://github.com/ucdjs/ucd/commit/4ee30d5a8df3b67e0bb38b28ca4006ec2c63fa0c))
* fix(path-utils): correct regex for stripping Windows drive letters ([c42629b3](https://github.com/ucdjs/ucd/commit/c42629b3902389c7f26809dce3a5b10664d6f13d))
* fix(path-utils): update logic to recognize forward-slash UNC paths ([14ff1f46](https://github.com/ucdjs/ucd/commit/14ff1f46a92e80fb010fc84369409f95ca54859b))
* fix(path-utils): update isUNCPath logic to use getAnyUNCRoot ([cbdb5457](https://github.com/ucdjs/ucd/commit/cbdb54573d088681a6e3056299f1308aae2b1ef1))
* fix(path-utils): improve path boundary checks in internal_resolveWindowsPath ([abf3806d](https://github.com/ucdjs/ucd/commit/abf3806dceb8022d6c452c419f4d14d8a8c67e53))
* fix(path-utils): improve UNC path handling in internal_resolveWindowsPath ([bb2327cf](https://github.com/ucdjs/ucd/commit/bb2327cf692b0941b5c697ae0e0f34d1dd0d9960))
* fix(path-utils): validate normalized paths within boundary ([f4fd13de](https://github.com/ucdjs/ucd/commit/f4fd13decce05975ffd5244ef06e7f209ae53f94))
* fix(path-utils): handle path decoding errors ([539d0a9d](https://github.com/ucdjs/ucd/commit/539d0a9db0f5b78ed69e0aa57a4246a4eaf26547))
* fix(path-utils): improve path resolution for case sensitivity ([03c732da](https://github.com/ucdjs/ucd/commit/03c732da97ecff240a827a2f881a4e3cfe810038))
* fix(path-utils): resolve Windows path normalization issue ([9ff80e37](https://github.com/ucdjs/ucd/commit/9ff80e3743eb1ff56ba38b84eb241d16c1a82069))
* fix(path-utils): simplify Windows path resolution ([42c7a398](https://github.com/ucdjs/ucd/commit/42c7a3987f7320afb17b467c3d97e944c655ddda))
* fix(path-utils): only normalize when both paths is windows drives ([92e2c495](https://github.com/ucdjs/ucd/commit/92e2c49563a400706822103d76ee2ab3adca990f))
* fix(path-utils): normalize base path in internal_resolveWindowsPath ([e3d5cd64](https://github.com/ucdjs/ucd/commit/e3d5cd64084b446237b1b2cada69c301a42f65cf))
* fix(path-utils): simplify Windows path resolution ([05d6907b](https://github.com/ucdjs/ucd/commit/05d6907b05e84e3429a1f83f882923d8465aa7e0))
* fix(path-utils): trim trailing slashes in toUnixFormat function ([9e7eff34](https://github.com/ucdjs/ucd/commit/9e7eff34e5bfbb639333f9c8afa6db93a29390d9))

### Miscellaneous

* Merge branch 'path-utils' into implement-path-util-logic ([99af8586](https://github.com/ucdjs/ucd/commit/99af8586405b119e57d450593356bc5aa5d6447d))
