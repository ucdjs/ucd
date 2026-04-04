# @ucdjs/pipeline-core

## [0.0.1-beta.11](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.10...@ucdjs/pipeline-core@0.0.1-beta.11) (2026-04-04)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.10...@ucdjs/pipeline-core@0.0.1-beta.11)


## [0.0.1-beta.10](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.10...@ucdjs/pipeline-core@0.0.1-beta.10) (2026-04-03)


### 🚀 Features
* introduce PipelineGraph types and interfaces ([4968f834](https://github.com/ucdjs/ucd/commit/4968f83438973666f1be14b5800543953482ecaf)) (by [@luxass](https://github.com/luxass))
* add new transforms and tests for deduplication, expansion, and normalization ([58699db1](https://github.com/ucdjs/ucd/commit/58699db1af20ac7724702ec03f1d7aaafe50bf20)) (by [@luxass](https://github.com/luxass))
* add tracing module with trace model ([43c2b4d7](https://github.com/ucdjs/ucd/commit/43c2b4d7e33dc2b9d12c900f051dbbbffa4bb413)) (by [@luxass](https://github.com/luxass))
* add filter and include support to pipelines ([c85c5375](https://github.com/ucdjs/ucd/commit/c85c53754a030f9b1601636fa8882588897cc6cf)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add context-aware logger to runtime contexts ([dd578d3b](https://github.com/ucdjs/ucd/commit/dd578d3bb02b489b3f63dfeb14e9d4d60262c9c4)) (by [@luxass](https://github.com/luxass))
* add memory backend and source implementations ([967e7734](https://github.com/ucdjs/ucd/commit/967e7734e981a51e279b708885500b5b2fb6b3e7)) (by [@luxass](https://github.com/luxass))
* implement caching and event handling ([118e7fd3](https://github.com/ucdjs/ucd/commit/118e7fd39f9bc3478776845a7c08ce20bb8d40b6)) (by [@luxass](https://github.com/luxass))
* enhance mock utilities for routing tests ([547bc8ec](https://github.com/ucdjs/ucd/commit/547bc8ec5a730b2c8b75754fb9395349e72a4060)) (by [@luxass](https://github.com/luxass))
* add name property to pipeline definition ([57da7d97](https://github.com/ucdjs/ucd/commit/57da7d97f0e33f87c9e3e8eafcca9325c856d4b2)) (by [@luxass](https://github.com/luxass))
* add new pipeline definition types and tests ([c7ce6d01](https://github.com/ucdjs/ucd/commit/c7ce6d01b560e9a5b2f2c2c93f1bab84dc60c335)) (by [@luxass](https://github.com/luxass))
* copy from pipelines-v1 ([89ba2bcc](https://github.com/ucdjs/ucd/commit/89ba2bccd2eecda90d9bcbec4e795e2e26854398)) (by [@luxass](https://github.com/luxass))
* add support for transforms ([395150e1](https://github.com/ucdjs/ucd/commit/395150e1c4e64dd76577a0add887ca4945528939)) (by [@luxass](https://github.com/luxass))
* initialize pipeline packages with basic structure ([18995811](https://github.com/ucdjs/ucd/commit/18995811e25bef40443dc2db62c07aa5d0aaf985)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* replace regex-based dash trimming with plain string scan ([2c9bb4cc](https://github.com/ucdjs/ucd/commit/2c9bb4cc4550d05265dc95c8010076448d197889)) (by [@luxass](https://github.com/luxass))
* address remaining PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([34a6f4ce](https://github.com/ucdjs/ucd/commit/34a6f4ce9d8cc1c086ffdb6d2e0f61ec3f5da99e)) (by [@luxass](https://github.com/luxass))
* address PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([562a1ddc](https://github.com/ucdjs/ucd/commit/562a1ddcf5a7937f1cf36586ad40eda3d15d86de)) (by [@luxass](https://github.com/luxass))
* improve error handling in parseDependency function ([ded8b302](https://github.com/ucdjs/ucd/commit/ded8b30216048a174944d19ad642d675ab24b6af)) (by [@luxass](https://github.com/luxass))
## [0.0.1-beta.9](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.8...@ucdjs/pipeline-core@0.0.1-beta.9) (2026-04-03)


### 🚀 Features
* introduce PipelineGraph types and interfaces ([4968f834](https://github.com/ucdjs/ucd/commit/4968f83438973666f1be14b5800543953482ecaf)) (by [@luxass](https://github.com/luxass))
* add new transforms and tests for deduplication, expansion, and normalization ([58699db1](https://github.com/ucdjs/ucd/commit/58699db1af20ac7724702ec03f1d7aaafe50bf20)) (by [@luxass](https://github.com/luxass))
* add tracing module with trace model ([43c2b4d7](https://github.com/ucdjs/ucd/commit/43c2b4d7e33dc2b9d12c900f051dbbbffa4bb413)) (by [@luxass](https://github.com/luxass))
* add filter and include support to pipelines ([c85c5375](https://github.com/ucdjs/ucd/commit/c85c53754a030f9b1601636fa8882588897cc6cf)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add context-aware logger to runtime contexts ([dd578d3b](https://github.com/ucdjs/ucd/commit/dd578d3bb02b489b3f63dfeb14e9d4d60262c9c4)) (by [@luxass](https://github.com/luxass))
* add memory backend and source implementations ([967e7734](https://github.com/ucdjs/ucd/commit/967e7734e981a51e279b708885500b5b2fb6b3e7)) (by [@luxass](https://github.com/luxass))
* implement caching and event handling ([118e7fd3](https://github.com/ucdjs/ucd/commit/118e7fd39f9bc3478776845a7c08ce20bb8d40b6)) (by [@luxass](https://github.com/luxass))
* enhance mock utilities for routing tests ([547bc8ec](https://github.com/ucdjs/ucd/commit/547bc8ec5a730b2c8b75754fb9395349e72a4060)) (by [@luxass](https://github.com/luxass))
* add name property to pipeline definition ([57da7d97](https://github.com/ucdjs/ucd/commit/57da7d97f0e33f87c9e3e8eafcca9325c856d4b2)) (by [@luxass](https://github.com/luxass))
* add new pipeline definition types and tests ([c7ce6d01](https://github.com/ucdjs/ucd/commit/c7ce6d01b560e9a5b2f2c2c93f1bab84dc60c335)) (by [@luxass](https://github.com/luxass))
* copy from pipelines-v1 ([89ba2bcc](https://github.com/ucdjs/ucd/commit/89ba2bccd2eecda90d9bcbec4e795e2e26854398)) (by [@luxass](https://github.com/luxass))
* add support for transforms ([395150e1](https://github.com/ucdjs/ucd/commit/395150e1c4e64dd76577a0add887ca4945528939)) (by [@luxass](https://github.com/luxass))
* initialize pipeline packages with basic structure ([18995811](https://github.com/ucdjs/ucd/commit/18995811e25bef40443dc2db62c07aa5d0aaf985)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* replace regex-based dash trimming with plain string scan ([2c9bb4cc](https://github.com/ucdjs/ucd/commit/2c9bb4cc4550d05265dc95c8010076448d197889)) (by [@luxass](https://github.com/luxass))
* address remaining PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([34a6f4ce](https://github.com/ucdjs/ucd/commit/34a6f4ce9d8cc1c086ffdb6d2e0f61ec3f5da99e)) (by [@luxass](https://github.com/luxass))
* address PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([562a1ddc](https://github.com/ucdjs/ucd/commit/562a1ddcf5a7937f1cf36586ad40eda3d15d86de)) (by [@luxass](https://github.com/luxass))
* improve error handling in parseDependency function ([ded8b302](https://github.com/ucdjs/ucd/commit/ded8b30216048a174944d19ad642d675ab24b6af)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.8](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.8...@ucdjs/pipeline-core@0.0.1-beta.8) (2026-03-29)


### 🚀 Features
* introduce PipelineGraph types and interfaces ([4968f834](https://github.com/ucdjs/ucd/commit/4968f83438973666f1be14b5800543953482ecaf)) (by [@luxass](https://github.com/luxass))
* add new transforms and tests for deduplication, expansion, and normalization ([58699db1](https://github.com/ucdjs/ucd/commit/58699db1af20ac7724702ec03f1d7aaafe50bf20)) (by [@luxass](https://github.com/luxass))
* add tracing module with trace model ([43c2b4d7](https://github.com/ucdjs/ucd/commit/43c2b4d7e33dc2b9d12c900f051dbbbffa4bb413)) (by [@luxass](https://github.com/luxass))
* add filter and include support to pipelines ([c85c5375](https://github.com/ucdjs/ucd/commit/c85c53754a030f9b1601636fa8882588897cc6cf)) (by [@luxass](https://github.com/luxass), Claude Opus 4.6 (1M context))
* add context-aware logger to runtime contexts ([dd578d3b](https://github.com/ucdjs/ucd/commit/dd578d3bb02b489b3f63dfeb14e9d4d60262c9c4)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* replace regex-based dash trimming with plain string scan ([2c9bb4cc](https://github.com/ucdjs/ucd/commit/2c9bb4cc4550d05265dc95c8010076448d197889)) (by [@luxass](https://github.com/luxass))
* address remaining PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([34a6f4ce](https://github.com/ucdjs/ucd/commit/34a6f4ce9d8cc1c086ffdb6d2e0f61ec3f5da99e)) (by [@luxass](https://github.com/luxass))
* address PR #557 review issues ([Issue #557](https://github.com/ucdjs/ucd/issues/557)) ([562a1ddc](https://github.com/ucdjs/ucd/commit/562a1ddcf5a7937f1cf36586ad40eda3d15d86de)) (by [@luxass](https://github.com/luxass))
## [0.0.1-beta.7](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.6...@ucdjs/pipeline-core@0.0.1-beta.7) (2026-02-27)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.6...@ucdjs/pipeline-core@0.0.1-beta.7)


## [0.0.1-beta.6](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.5...@ucdjs/pipeline-core@0.0.1-beta.6) (2026-02-19)


*No significant changes*

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.5...@ucdjs/pipeline-core@0.0.1-beta.6)


## [0.0.1-beta.5](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.4...@ucdjs/pipeline-core@0.0.1-beta.5) (2026-02-16)




### Notes

* No significant commits in this release.


## [0.0.1-beta.4](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.3...@ucdjs/pipeline-core@0.0.1-beta.4) (2026-02-15)




### Notes

* No significant commits in this release.


## [0.0.1-beta.2](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.2...@ucdjs/pipeline-core@0.0.1-beta.2) (2026-02-15)


### 🚀 Features
* add memory backend and source implementations ([967e7734](https://github.com/ucdjs/ucd/commit/967e7734e981a51e279b708885500b5b2fb6b3e7)) (by [@luxass](https://github.com/luxass))
* implement caching and event handling ([118e7fd3](https://github.com/ucdjs/ucd/commit/118e7fd39f9bc3478776845a7c08ce20bb8d40b6)) (by [@luxass](https://github.com/luxass))
* enhance mock utilities for routing tests ([547bc8ec](https://github.com/ucdjs/ucd/commit/547bc8ec5a730b2c8b75754fb9395349e72a4060)) (by [@luxass](https://github.com/luxass))
* add name property to pipeline definition ([57da7d97](https://github.com/ucdjs/ucd/commit/57da7d97f0e33f87c9e3e8eafcca9325c856d4b2)) (by [@luxass](https://github.com/luxass))
* add new pipeline definition types and tests ([c7ce6d01](https://github.com/ucdjs/ucd/commit/c7ce6d01b560e9a5b2f2c2c93f1bab84dc60c335)) (by [@luxass](https://github.com/luxass))
* copy from pipelines-v1 ([89ba2bcc](https://github.com/ucdjs/ucd/commit/89ba2bccd2eecda90d9bcbec4e795e2e26854398)) (by [@luxass](https://github.com/luxass))
* add support for transforms ([395150e1](https://github.com/ucdjs/ucd/commit/395150e1c4e64dd76577a0add887ca4945528939)) (by [@luxass](https://github.com/luxass))
* initialize pipeline packages with basic structure ([18995811](https://github.com/ucdjs/ucd/commit/18995811e25bef40443dc2db62c07aa5d0aaf985)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* improve error handling in parseDependency function ([ded8b302](https://github.com/ucdjs/ucd/commit/ded8b30216048a174944d19ad642d675ab24b6af)) (by [@luxass](https://github.com/luxass))
## [0.0.1-beta.1](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1-beta.0...@ucdjs/pipeline-core@0.0.1-beta.1) (2026-02-15)


### 🚀 Features
* add memory backend and source implementations ([967e7734](https://github.com/ucdjs/ucd/commit/967e7734e981a51e279b708885500b5b2fb6b3e7)) (by [@luxass](https://github.com/luxass))
* implement caching and event handling ([118e7fd3](https://github.com/ucdjs/ucd/commit/118e7fd39f9bc3478776845a7c08ce20bb8d40b6)) (by [@luxass](https://github.com/luxass))
* enhance mock utilities for routing tests ([547bc8ec](https://github.com/ucdjs/ucd/commit/547bc8ec5a730b2c8b75754fb9395349e72a4060)) (by [@luxass](https://github.com/luxass))
* add name property to pipeline definition ([57da7d97](https://github.com/ucdjs/ucd/commit/57da7d97f0e33f87c9e3e8eafcca9325c856d4b2)) (by [@luxass](https://github.com/luxass))
* add new pipeline definition types and tests ([c7ce6d01](https://github.com/ucdjs/ucd/commit/c7ce6d01b560e9a5b2f2c2c93f1bab84dc60c335)) (by [@luxass](https://github.com/luxass))
* copy from pipelines-v1 ([89ba2bcc](https://github.com/ucdjs/ucd/commit/89ba2bccd2eecda90d9bcbec4e795e2e26854398)) (by [@luxass](https://github.com/luxass))
* add support for transforms ([395150e1](https://github.com/ucdjs/ucd/commit/395150e1c4e64dd76577a0add887ca4945528939)) (by [@luxass](https://github.com/luxass))
* initialize pipeline packages with basic structure ([18995811](https://github.com/ucdjs/ucd/commit/18995811e25bef40443dc2db62c07aa5d0aaf985)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* improve error handling in parseDependency function ([ded8b302](https://github.com/ucdjs/ucd/commit/ded8b30216048a174944d19ad642d675ab24b6af)) (by [@luxass](https://github.com/luxass))


## [0.0.1-beta.0](https://github.com/ucdjs/ucd/compare/@ucdjs/pipeline-core@0.0.1...@ucdjs/pipeline-core@0.0.1-beta.0) (2026-02-15)


### 🚀 Features
* add memory backend and source implementations ([967e7734](https://github.com/ucdjs/ucd/commit/967e7734e981a51e279b708885500b5b2fb6b3e7)) (by [@luxass](https://github.com/luxass))
* implement caching and event handling ([118e7fd3](https://github.com/ucdjs/ucd/commit/118e7fd39f9bc3478776845a7c08ce20bb8d40b6)) (by [@luxass](https://github.com/luxass))
* enhance mock utilities for routing tests ([547bc8ec](https://github.com/ucdjs/ucd/commit/547bc8ec5a730b2c8b75754fb9395349e72a4060)) (by [@luxass](https://github.com/luxass))
* add name property to pipeline definition ([57da7d97](https://github.com/ucdjs/ucd/commit/57da7d97f0e33f87c9e3e8eafcca9325c856d4b2)) (by [@luxass](https://github.com/luxass))
* add new pipeline definition types and tests ([c7ce6d01](https://github.com/ucdjs/ucd/commit/c7ce6d01b560e9a5b2f2c2c93f1bab84dc60c335)) (by [@luxass](https://github.com/luxass))
* copy from pipelines-v1 ([89ba2bcc](https://github.com/ucdjs/ucd/commit/89ba2bccd2eecda90d9bcbec4e795e2e26854398)) (by [@luxass](https://github.com/luxass))
* add support for transforms ([395150e1](https://github.com/ucdjs/ucd/commit/395150e1c4e64dd76577a0add887ca4945528939)) (by [@luxass](https://github.com/luxass))
* initialize pipeline packages with basic structure ([18995811](https://github.com/ucdjs/ucd/commit/18995811e25bef40443dc2db62c07aa5d0aaf985)) (by [@luxass](https://github.com/luxass))

### 🐞 Bug Fixes
* improve error handling in parseDependency function ([ded8b302](https://github.com/ucdjs/ucd/commit/ded8b30216048a174944d19ad642d675ab24b6af)) (by [@luxass](https://github.com/luxass))
