# @ucdjs/schema-gen v1.0.0
**Previous version**: `0.2.2`
**New version**: `1.0.0`


## ✨ Features
- **shared**: migrate utilities to @ucdjs-internal/shared (`4d7588fd`)
- add turbo.json configuration files for cli, schema-gen, ucd-store, and utils; update tsconfig.base.build.json and remove test:watch task from turbo.json (`48dad498`)
- enable tsdown exports (`8d890cb3`)

## 🐛 Bug Fixes
- **cli, schema-gen**: update dependency from `@luxass/unicode-utils` to `@luxass/unicode-utils-old` (`46b62b64`)
- throw if unresolved import (`8123dda2`)

## ♻️ Refactoring
- reorganize pnpm catalogs for better scoping (##480) (`ba721776`)
- **tsdown-config**: update package references to @ucdjs-tooling/tsdown-config (`ccc002da`)
- update tsconfig references to use @ucdjs-tooling/tsconfig (`e5c39ac8`)
- **fields**: use fileURLToPath for consistent path handling (`fb178d95`)

## 🔧 Chores
- **workspace**: update dependencies and package manager (`1fcda2ca`)
- reorganize package catalogs and update dependencies (`ea2df11e`)
- update packageManager to pnpm@10.29.1 across all packages (`6bb966ab`)
- update dependencies and package manager (`e91a1ec4`)
- update dependencies (`59402701`)
- update pkg (`b4039996`)
- update dependencies (`51e6a071`)
- update typecheck command in package.json files (`34fa0ae7`)
- upgrade pnpm (`b06a7dd7`)
- update test for ai pkg (`05930920`)
- update dependencies (`4b3590b9`)
- **deps**: update dependencies and package manager version (`8c5f051f`)
- **deps**: update package versions in `pnpm-workspace.yaml` (`2cca2fdf`)
- **deps**: update package versions in `pnpm-workspace.yaml` and package.json files (`34f3cab1`)
- **release**: 📦 version packages (`d592b87c`)
- update pnpm (`62648fcd`)
- update pnpm (`7e789f64`)
- update dependencies (`bf3b20f8`)
- update packageManager to pnpm@10.16.1 across all packages (`ec4ebd9d`)
- update package versions in pnpm-workspace.yaml to remove caret (^) for consistency (`8521f03a`)
- use node 22.18 (`2a9bfcd7`)
- **schema-gen**: add dependency on @ucdjs/shared (`838a9ebe`)
- remove `p-limit` dependency across multiple packages (`a73147af`)
- fix imports (`162de26f`)
- update dependencies (`c813c448`)
- update build scripts to include custom TypeScript configuration (`ef9cf9a5`)
- **eslint**: refactor ESLint configuration across multiple packages (`4924a4c8`)
- **tsconfig**: standardize include and exclude patterns across configurations (`4ddbf590`)
- fix typecheck (`cdc2888c`)
- update node engine version across packages (##105) (`315a422d`)
- update dependencies (`a1d2a3a7`)
- update package versions in pnpm-workspace.yaml (`9dde454c`)
- add Codecov configuration and badges to documentation (`e18b6d02`)
- refactor tsdown configuration across packages (`323318de`)
- update pnpm workspace configuration (`e0f3343e`)
- migrate to use tooling packages (`5b7cf43a`)
- update dependencies (`f262f3fc`)


