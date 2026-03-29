# @ucdjs/pipelines-server

## [0.0.1-beta.8](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.7...@ucdjs/pipelines-server@0.0.1-beta.8) (2026-03-29)


### 🚀 Features
* add execution log viewer with span filtering ([235817e7](https://github.com/ucdjs/ucd/commit/235817e7252480e277dfa213f36ec0bdd5d4eba9)) (by [@luxass](https://github.com/luxass))
* add types for workspace and execution entities ([625d4434](https://github.com/ucdjs/ucd/commit/625d4434f3b9108ee91214ad0f4479df7db25b43)) (by [@luxass](https://github.com/luxass))
* enhance waterfall view with expand/collapse functionality ([19d5f767](https://github.com/ucdjs/ucd/commit/19d5f767e2bbd0f1349ba96f0f894e1af2f73d92)) (by [@luxass](https://github.com/luxass))
* add waterfall execution tracing components ([6e54d301](https://github.com/ucdjs/ucd/commit/6e54d301a6f824e233a507b73b94dc73d825517e)) (by [@luxass](https://github.com/luxass))
* implement execution detail page with trace data ([1408aad9](https://github.com/ucdjs/ucd/commit/1408aad9a8f77279dce5c4e26603317aa742c713)) (by [@luxass](https://github.com/luxass))
* enhance live updates with source queries ([6398cbe2](https://github.com/ucdjs/ucd/commit/6398cbe26609c6df4989da9e572481b4fd796543)) (by [@luxass](https://github.com/luxass))
* integrate `usePipelineRouteData` for route data management ([3dba68f6](https://github.com/ucdjs/ucd/commit/3dba68f6e8028658420b91f2481a80e41e9c4df1)) (by [@luxass](https://github.com/luxass))
* introduce PipelineGraph types and interfaces ([4968f834](https://github.com/ucdjs/ucd/commit/4968f83438973666f1be14b5800543953482ecaf)) (by [@luxass](https://github.com/luxass))
* add renderComponent for testing with Router context ([614feb5b](https://github.com/ucdjs/ucd/commit/614feb5be39a69ba47429c4b767f5dbce435120a)) (by [@luxass](https://github.com/luxass))
* match Vercel palette and use card bg for file list ([Issue #111](https://github.com/ucdjs/ucd/issues/111)) ([Issue #292929](https://github.com/ucdjs/ucd/issues/292929)) ([6059642a](https://github.com/ucdjs/ucd/commit/6059642a908730707eb3022f090858ab666c8393)) (by [@luxass](https://github.com/luxass))
* add detailed output and transform routes ([9870c613](https://github.com/ucdjs/ucd/commit/9870c6137fb9a6c6e1fe818171edceb321294638)) (by [@luxass](https://github.com/luxass))
* enhance pipeline inspection routes ([dea4d14a](https://github.com/ucdjs/ucd/commit/dea4d14aaf3bb801d053fcb06a87107dfb33fea0)) (by [@luxass](https://github.com/luxass))
* add inspect routes for pipelines ([3f7a245e](https://github.com/ucdjs/ucd/commit/3f7a245e618956598556f003bc5a3845cb0dab08)) (by [@luxass](https://github.com/luxass))
* add pipeline sidebar navigation ([507c7f2f](https://github.com/ucdjs/ucd/commit/507c7f2fa6f07d7eda87e9e90bb83f9777f1d521)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* redesign source page with two-column layout ([0213049f](https://github.com/ucdjs/ucd/commit/0213049fe0b9168717897a9a831e27b2b1d87382)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add filter and include support to pipelines ([c85c5375](https://github.com/ucdjs/ucd/commit/c85c53754a030f9b1601636fa8882588897cc6cf)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add logs error boundary and viewer components ([a0e21fad](https://github.com/ucdjs/ucd/commit/a0e21fad69610a8412c7acc7cbe607247215ee95)) (by [@luxass](https://github.com/luxass))
* enhance log storage to sync truncated messages ([f23c4475](https://github.com/ucdjs/ucd/commit/f23c4475424f7fa0b6cb6d483e83836d84240669)) (by [@luxass](https://github.com/luxass))
* enhance execution handling and logging ([7a7f786f](https://github.com/ucdjs/ucd/commit/7a7f786fe4a26adc41f612b969fdbcf5ee42c697)) (by [@luxass](https://github.com/luxass))
* improve execution log UI and standardize log payload types ([6a8170c4](https://github.com/ucdjs/ucd/commit/6a8170c422b5224d7d2cfd7cfaedf33acd002930)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add new pipeline implementations with logging and dependency handling ([879309e0](https://github.com/ucdjs/ucd/commit/879309e04dea4b0a92b5a341ab3fb3a0edc7d5ed)) (by [@luxass](https://github.com/luxass))
* migrate to vite 8 changes ([bbe9708b](https://github.com/ucdjs/ucd/commit/bbe9708b1e21a9229c7ba9fe928d7bc1997d41b5)) (by [@luxass](https://github.com/luxass))
* refactor execution span handling and styles ([fb0f8107](https://github.com/ucdjs/ucd/commit/fb0f810796fd4419bd446f3a8efc571cf1c588a4)) (by [@luxass](https://github.com/luxass))
* add new components for pipeline management ([3b974bba](https://github.com/ucdjs/ucd/commit/3b974bbac1676d994a3b495b5f3526cbe7cbcb83)) (by [@luxass](https://github.com/luxass))
* add new components for activity and source management ([912ef109](https://github.com/ucdjs/ucd/commit/912ef10953f27c5055bc2548e59214a5064f67a0)) (by [@luxass](https://github.com/luxass))
* add new components for execution activity and status overview ([93ac99c0](https://github.com/ucdjs/ucd/commit/93ac99c05e62dfeef29a6408a6aaec1622634555)) (by [@luxass](https://github.com/luxass))
* add PipelineHeader, PipelineTabs, and VersionSelector components ([6ca46c7f](https://github.com/ucdjs/ucd/commit/6ca46c7fb8427afbe3b4cd5aa4736981ef7ba9ec)) (by [@luxass](https://github.com/luxass))
* add navigable and collapsible source groups in sidebar ([01b5deed](https://github.com/ucdjs/ucd/commit/01b5deed0e49a2328a3fb33d68551fdb6ef9ff6c)) (by [@luxass](https://github.com/luxass))
* add graph node actions ([1fd6df47](https://github.com/ucdjs/ucd/commit/1fd6df47b4a2584352077060bc85793155d95c0b)) (by [@luxass](https://github.com/luxass))
* normalize execution summary structure ([525bdb84](https://github.com/ucdjs/ucd/commit/525bdb842174b16f49bf72e9b25e5f4ec41746e6)) (by [@luxass](https://github.com/luxass))
* add graph details and filters components ([bdcc9403](https://github.com/ucdjs/ucd/commit/bdcc9403160608d83922466eca3b306987bbae89)) (by [@luxass](https://github.com/luxass))
* refine source issue dialog controls ([6bdd85b9](https://github.com/ucdjs/ucd/commit/6bdd85b9a5684637ba4e7ded3101c8675ac135f9)) (by [@luxass](https://github.com/luxass))
* add source issue dialogs and trim source routes ([20274790](https://github.com/ucdjs/ucd/commit/202747901a8653dd31524cab31b4aa952a1434ca)) (by [@luxass](https://github.com/luxass))
* enhance execution queries with source and file filtering ([37852f74](https://github.com/ucdjs/ucd/commit/37852f744a6f8c6daea279fbbdd5eabb16938ce8)) (by [@luxass](https://github.com/luxass))
* align homepage recent executions with pipeline view ([0457e8b9](https://github.com/ucdjs/ucd/commit/0457e8b94a850ec7de84f47dc1d66df9d385aa15)) (by [@luxass](https://github.com/luxass))
* smooth homepage execution activity ([643f0eb7](https://github.com/ucdjs/ucd/commit/643f0eb7372aec196fd4eb702327c06bd502be4a)) (by [@luxass](https://github.com/luxass))
* add import failure and type error pipelines ([60456401](https://github.com/ucdjs/ucd/commit/60456401f18c2d112af59f80bc9818e6f9df2d58)) (by [@luxass](https://github.com/luxass))
* add PipelineHeader and PipelineTabs components ([e9991f62](https://github.com/ucdjs/ucd/commit/e9991f620eb29dc235547eaba416c8c2e7ff7394)) (by [@luxass](https://github.com/luxass))
* add PipelineHeader and PipelineTabs components ([928386da](https://github.com/ucdjs/ucd/commit/928386da50e0dadf43ea8de40f9e940cb5c90e7f)) (by [@luxass](https://github.com/luxass))
* redesign source overview cards ([fdf3b3c2](https://github.com/ucdjs/ucd/commit/fdf3b3c24b214ecfae8595e251843df2b629170a)) (by [@luxass](https://github.com/luxass))
* add overview homepage ([538f99cf](https://github.com/ucdjs/ucd/commit/538f99cf0246b14bf53940d0f66764cf458a2fbd)) (by [@luxass](https://github.com/luxass))
* improve execution graph layout and theming ([3c5557d4](https://github.com/ucdjs/ucd/commit/3c5557d4238a44d559600d99a9ab541c59b967b9)) (by [@luxass](https://github.com/luxass))
* add source-aware execution pages ([ffbbed3e](https://github.com/ucdjs/ucd/commit/ffbbed3ee49af4ac1170c3145e51a9ba9c0d3820)) (by [@luxass](https://github.com/luxass))
* adopt source-aware tanstack routes ([a4928dd0](https://github.com/ucdjs/ucd/commit/a4928dd0e3195324e963fdc9a72d8d28c250f67e)) (by [@luxass](https://github.com/luxass))
* switch API routes from pipelines to sources ([3761c240](https://github.com/ucdjs/ucd/commit/3761c24099e177accb66a6bc7fd2a13fb9197d54)) (by [@luxass](https://github.com/luxass))
* add new routes for source and file handling ([dade9cd6](https://github.com/ucdjs/ucd/commit/dade9cd688dda12e87cdd38ab1d2cdeb8e01708f)) (by [@luxass](https://github.com/luxass))
* update title and restructure main component ([b004c3a5](https://github.com/ucdjs/ucd/commit/b004c3a5b090ca2507da387dcfb36d1a327b157d)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* address remaining PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([34a6f4ce](https://github.com/ucdjs/ucd/commit/34a6f4ce9d8cc1c086ffdb6d2e0f61ec3f5da99e)) (by [@luxass](https://github.com/luxass))
* address PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([562a1ddc](https://github.com/ucdjs/ucd/commit/562a1ddcf5a7937f1cf36586ad40eda3d15d86de)) (by [@luxass](https://github.com/luxass))
* fix all lint errors and update remaining browser tests ([ca9cd493](https://github.com/ucdjs/ucd/commit/ca9cd493c6c84f38fe9309714a8c65b3c21319cf)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* allow graph node dragging ([469da696](https://github.com/ucdjs/ucd/commit/469da696ecc11eee4bb1aa055bdf235b6945b066)) (by [@luxass](https://github.com/luxass))
* refresh execution views and summaries ([c62717a4](https://github.com/ucdjs/ucd/commit/c62717a4503193b309b346f4cad92f60d1be9dc3)) (by [@luxass](https://github.com/luxass))
* fill pipeline overview sidebar ([3781d015](https://github.com/ucdjs/ucd/commit/3781d01579eb779c673822d52d21374e704a7178)) (by [@luxass](https://github.com/luxass))
* show source labels in navigation ([36d9b08b](https://github.com/ucdjs/ucd/commit/36d9b08bdcfc317e8089bd17dcfde542b3c4b968)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.7](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.6...@ucdjs/pipelines-server@0.0.1-beta.7) (2026-02-27)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.6...@ucdjs/pipelines-server@0.0.1-beta.7)


## [0.0.1-beta.6](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.5...@ucdjs/pipelines-server@0.0.1-beta.6) (2026-02-19)


### 🚀 Features
* add workspaceId to PipelinesResponse and display in sidebar ([b1477cf1](https://github.com/ucdjs/ucd/commit/b1477cf139dae39af2e9de7688fc1eed251b24a1)) (by [@luxass](https://github.com/luxass))
* enhance workspace support in server and routes ([362987c2](https://github.com/ucdjs/ucd/commit/362987c26d10891bbb026e761b4fb6775d97f40b)) (by [@luxass](https://github.com/luxass))
* update workspace_id defaults in migrations ([6889177c](https://github.com/ucdjs/ucd/commit/6889177c8d3506436cd0a37abbe1e073973a9cba)) (by [@luxass](https://github.com/luxass))
* add workspace support to database schema and routes ([0abf519a](https://github.com/ucdjs/ucd/commit/0abf519ad54b0c0af3e72a5226dc8b0b885f8eb8)) (by [@luxass](https://github.com/luxass))
* add shared package as a workspace dependency ([587e6604](https://github.com/ucdjs/ucd/commit/587e66046f16f7aaacda4bc8c1b10432bbde6939)) (by [@luxass](https://github.com/luxass))
* add workspaceId to execution context and logs ([c50bfb90](https://github.com/ucdjs/ucd/commit/c50bfb90af903133e8a790b2bb0fcda3e13bb603)) (by [@luxass](https://github.com/luxass))
* add workspace management functions ([a9e9ff85](https://github.com/ucdjs/ucd/commit/a9e9ff855426fb1c1ec37025acf5a570c0b96782)) (by [@luxass](https://github.com/luxass))
* add workspace support to app options ([3620d88e](https://github.com/ucdjs/ucd/commit/3620d88e2d95551d379c8efa6cefa0950984e208)) (by [@luxass](https://github.com/luxass))
* update database schema and add workspace support ([6889ff27](https://github.com/ucdjs/ucd/commit/6889ff274ae0873458a248467508fb129a00e48b)) (by [@luxass](https://github.com/luxass))
* add workspaces table and update related schemas ([7c13fd37](https://github.com/ucdjs/ucd/commit/7c13fd37a6771b26b6c2fa251f1baeffd6658cb4)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* copy migrations folder to dist ([06dc7938](https://github.com/ucdjs/ucd/commit/06dc7938da4dfaf1d1cf22c452e496c7b14c37a0)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.5](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.4...@ucdjs/pipelines-server@0.0.1-beta.5) (2026-02-16)



### 🐞 Bug Fixes
* add TypeScript types to exports in package.json ([395eb0bc](https://github.com/ucdjs/ucd/commit/395eb0bcc5581e5889e6c8780ee7220311983d4b)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.3...@ucdjs/pipelines-server@0.0.1-beta.4) (2026-02-15)




### Notes

* No significant commits in this release.


## [0.0.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.2...@ucdjs/pipelines-server@0.0.1-beta.2) (2026-02-15)


### 🚀 Features
* initialize database with auto-migration and update Vite config for SSR ([fd344fd4](https://github.com/ucdjs/ucd/commit/fd344fd4ee71f8e00bb0e937ff2c71e8e2477a39)) (by [@luxass](https://github.com/luxass))
* implement execution graph and overview pages ([78fd076f](https://github.com/ucdjs/ucd/commit/78fd076fd7abf7f1dfa74994c4b0027885a9f53e)) (by [@luxass](https://github.com/luxass))
* add lazy loading for code route and components ([abb7913c](https://github.com/ucdjs/ucd/commit/abb7913ce8056d6087b469a2d28a840c8863eeb8)) (by [@luxass](https://github.com/luxass))
* refactor route handling to use lazy loading ([5ad5cd3d](https://github.com/ucdjs/ucd/commit/5ad5cd3d931dd5ebd22ba889d674a6b1ed2ff958)) (by [@luxass](https://github.com/luxass))
* update Button render prop to pass props ([ae5f598b](https://github.com/ucdjs/ucd/commit/ae5f598b3b8be3f0a45bfdde790f70110ed2ccdb)) (by [@luxass](https://github.com/luxass))
* refactor file-explorer components and add utility functions ([c6d188a4](https://github.com/ucdjs/ucd/commit/c6d188a404a6c8d4d51d4f9509ff42b194f1d87d)) (by [@luxass](https://github.com/luxass))
* add execution logs and formatting utilities ([f5d257ef](https://github.com/ucdjs/ucd/commit/f5d257efb4eff5463c2bf94c13c17c614db96668)) (by [@luxass](https://github.com/luxass))
* add initial pipeline server ([df6c8c37](https://github.com/ucdjs/ucd/commit/df6c8c37ea026a49f4e462af4a893977dfd02ed7)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* use fileURLToPath for migrations folder ([e807e966](https://github.com/ucdjs/ucd/commit/e807e9661332e323bbf314b175959ba2390e73d1)) (by [@luxass](https://github.com/luxass))
## [0.0.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1-beta.0...@ucdjs/pipelines-server@0.0.1-beta.1) (2026-02-15)


### 🚀 Features
* initialize database with auto-migration and update Vite config for SSR ([fd344fd4](https://github.com/ucdjs/ucd/commit/fd344fd4ee71f8e00bb0e937ff2c71e8e2477a39)) (by [@luxass](https://github.com/luxass))
* implement execution graph and overview pages ([78fd076f](https://github.com/ucdjs/ucd/commit/78fd076fd7abf7f1dfa74994c4b0027885a9f53e)) (by [@luxass](https://github.com/luxass))
* add lazy loading for code route and components ([abb7913c](https://github.com/ucdjs/ucd/commit/abb7913ce8056d6087b469a2d28a840c8863eeb8)) (by [@luxass](https://github.com/luxass))
* refactor route handling to use lazy loading ([5ad5cd3d](https://github.com/ucdjs/ucd/commit/5ad5cd3d931dd5ebd22ba889d674a6b1ed2ff958)) (by [@luxass](https://github.com/luxass))
* update Button render prop to pass props ([ae5f598b](https://github.com/ucdjs/ucd/commit/ae5f598b3b8be3f0a45bfdde790f70110ed2ccdb)) (by [@luxass](https://github.com/luxass))
* refactor file-explorer components and add utility functions ([c6d188a4](https://github.com/ucdjs/ucd/commit/c6d188a404a6c8d4d51d4f9509ff42b194f1d87d)) (by [@luxass](https://github.com/luxass))
* add execution logs and formatting utilities ([f5d257ef](https://github.com/ucdjs/ucd/commit/f5d257efb4eff5463c2bf94c13c17c614db96668)) (by [@luxass](https://github.com/luxass))
* add initial pipeline server ([df6c8c37](https://github.com/ucdjs/ucd/commit/df6c8c37ea026a49f4e462af4a893977dfd02ed7)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* use fileURLToPath for migrations folder ([e807e966](https://github.com/ucdjs/ucd/commit/e807e9661332e323bbf314b175959ba2390e73d1)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/pipelines-server@0.0.1...@ucdjs/pipelines-server@0.0.1-beta.0) (2026-02-15)


### 🚀 Features
* initialize database with auto-migration and update Vite config for SSR ([fd344fd4](https://github.com/ucdjs/ucd/commit/fd344fd4ee71f8e00bb0e937ff2c71e8e2477a39)) (by [@luxass](https://github.com/luxass))
* implement execution graph and overview pages ([78fd076f](https://github.com/ucdjs/ucd/commit/78fd076fd7abf7f1dfa74994c4b0027885a9f53e)) (by [@luxass](https://github.com/luxass))
* add lazy loading for code route and components ([abb7913c](https://github.com/ucdjs/ucd/commit/abb7913ce8056d6087b469a2d28a840c8863eeb8)) (by [@luxass](https://github.com/luxass))
* refactor route handling to use lazy loading ([5ad5cd3d](https://github.com/ucdjs/ucd/commit/5ad5cd3d931dd5ebd22ba889d674a6b1ed2ff958)) (by [@luxass](https://github.com/luxass))
* update Button render prop to pass props ([ae5f598b](https://github.com/ucdjs/ucd/commit/ae5f598b3b8be3f0a45bfdde790f70110ed2ccdb)) (by [@luxass](https://github.com/luxass))
* refactor file-explorer components and add utility functions ([c6d188a4](https://github.com/ucdjs/ucd/commit/c6d188a404a6c8d4d51d4f9509ff42b194f1d87d)) (by [@luxass](https://github.com/luxass))
* add execution logs and formatting utilities ([f5d257ef](https://github.com/ucdjs/ucd/commit/f5d257efb4eff5463c2bf94c13c17c614db96668)) (by [@luxass](https://github.com/luxass))
* add initial pipeline server ([df6c8c37](https://github.com/ucdjs/ucd/commit/df6c8c37ea026a49f4e462af4a893977dfd02ed7)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* use fileURLToPath for migrations folder ([e807e966](https://github.com/ucdjs/ucd/commit/e807e9661332e323bbf314b175959ba2390e73d1)) (by [@luxass](https://github.com/luxass))
