# @ucdjs/test-utils

## [1.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/test-utils@1.0.0...@ucdjs/test-utils@1.1.0) (2025-11-16)

### Bug Fixes

* fix(ucd-store-v2): ensure 'read:before' hook is correctly set up ([e2831585](https://github.com/ucdjs/ucd/commit/e2831585ef825a2f11ba90bee18f1631a9c36804))
* fix: update file paths to include 'extracted' prefix (#371) ([#371](https://github.com/ucdjs/ucd/issues/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243))
* fix(test-utils): update wildcard route handling ([c662bec8](https://github.com/ucdjs/ucd/commit/c662bec8429c98e5fd98942e2c12f0e6fd479d51))
* fix: switch behaviour ([70a2b8df](https://github.com/ucdjs/ucd/commit/70a2b8df611fcf2041c1f41a1d05171a19541c91))
* fix: handle wildcard params differently ([43640a1e](https://github.com/ucdjs/ucd/commit/43640a1e2a905f669708a76c8193558429d36df3))
* fix(test-utils): improve debug message for wrapMockFetch ([04a939cc](https://github.com/ucdjs/ucd/commit/04a939cccd06940d42946a7cf72360f597ae62d5))
* fix(test-utils): improve header handling in `afterFetch` for response ([34dc1f4c](https://github.com/ucdjs/ucd/commit/34dc1f4cdabed4651ede28b14eacb4da20b29d04))
* fix(test-utils): update `Params` type in `TypedResponseResolver` for better type safety ([dd0c510c](https://github.com/ucdjs/ucd/commit/dd0c510ccad61cf9a481f770b25dc1305dc5d474))
* fix(test-utils): improve TypeScript type inference for providedResponse ([bfd05075](https://github.com/ucdjs/ucd/commit/bfd0507535db0bc01bc367bf918ff5f91f9c78ff))
* fix(test-utils): adjust latency expectation in tests ([0caa3e94](https://github.com/ucdjs/ucd/commit/0caa3e9409e9ac397ac495c2f37b5a028a39be7a))
* fix(test-utils): improve response validation and error message ([ff437240](https://github.com/ucdjs/ucd/commit/ff4372408f96a19fda604c733879d05225d24c48))
* fix(test-utils): improve header handling in `wrapMockFetchWithConfig` ([6aaf8a17](https://github.com/ucdjs/ucd/commit/6aaf8a17b5edf7580c44d25b3cf7af737f0af14b))
* fix(test-utils): rename `setupMockStore` to `mockStoreApi` for clarity ([80f2d4a3](https://github.com/ucdjs/ucd/commit/80f2d4a39aeaaad853206fb05b358f7911f32258))
* fix(test-utils): cast response to HttpResponseResolver in handlers ([9d01beb5](https://github.com/ucdjs/ucd/commit/9d01beb56201f0d19484e46112285600926b9371))
* fix(test-utils): normalize base URL correctly ([ad160737](https://github.com/ucdjs/ucd/commit/ad16073723399deabbfa019836d00d4d29094ba6))
* fix(test-utils): update vitest-setup path and improve setupMockStore return type ([c9b2a1cd](https://github.com/ucdjs/ucd/commit/c9b2a1cdadecf0262fa6dc7870db9341544d59ba))

### Features

* feat(test-utils): add ApiError auto-conversion and related tests ([1d2aa933](https://github.com/ucdjs/ucd/commit/1d2aa933b17d21714edc799ba32edbeb9cbc5ab8))
* feat(test-utils): update callback payload types for wrapMockFetch ([1feca597](https://github.com/ucdjs/ucd/commit/1feca5976618820c3cbdacf24754e3ca22730cbf))
* feat(test-utils): enhance mockStoreApi with debugging and improved request handling ([793dcdec](https://github.com/ucdjs/ucd/commit/793dcdecf9a9d9d756fa2e9bc71e10133b687b73))
* feat(test-utils): add onRequest callback to mockStoreApi and wrapMockFetch ([fa97b58d](https://github.com/ucdjs/ucd/commit/fa97b58da28958ad254caa66e0cd123dd15a651f))
* feat(test-utils): add support for custom mock fetch handlers ([cb719a30](https://github.com/ucdjs/ucd/commit/cb719a3048336496f56f8e57f1aa46932e9e40a1))
* feat(test-utils): enhance response handling with `configure` and `unsafeResponse` ([e3cf3525](https://github.com/ucdjs/ucd/commit/e3cf3525a773d79bebe06599e8767919b53360f0))
* feat(test-utils): add tests for `unsafeResponse` functionality ([2c30435e](https://github.com/ucdjs/ucd/commit/2c30435e337db136f797d992161937d5b4634874))
* feat(test-utils): add `unsafeResponse` function for testing edge cases ([e2f10ee6](https://github.com/ucdjs/ucd/commit/e2f10ee642f4a7fd5776f2efaea6a547eaa94a12))
* feat(test-utils): normalize root path handling in memory file system bridge ([a1b73221](https://github.com/ucdjs/ucd/commit/a1b73221b5a9c0082e61c355babd94c05674bf7f))
* feat(test-utils): enhance directory structure handling in memory file system bridge ([8f327e8f](https://github.com/ucdjs/ucd/commit/8f327e8fb384332cd91fbeb3186f08a859de7fe4))
* feat(test-utils): add in-memory file system bridge implementation ([8bde966f](https://github.com/ucdjs/ucd/commit/8bde966f5b12e43d5cb3e90ea63be9f1ceb955fd))
* feat(test-utils): add fs-bridges entry to tsdown configuration ([8f982761](https://github.com/ucdjs/ucd/commit/8f982761a2e86d5aaf556685efdc521d61aee026))
* feat(mock-store): add well-known handler for UCD configuration ([15212df0](https://github.com/ucdjs/ucd/commit/15212df0a3a0637671e8e5a53a4f606d9b031d33))
* feat(shared): add custom fetch ([d66c2282](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a))
* feat(test-utils): add mockFetch function for MSW integration ([0ffc6768](https://github.com/ucdjs/ucd/commit/0ffc6768d3360b1e9f0507c70843eb9b58027a1f))
* feat(test-utils): add mockFetch to handler functions and improve setupMockStore ([6af022c3](https://github.com/ucdjs/ucd/commit/6af022c3d29494d37378ca30ca72df82faa25e5b))
* feat(test-utils): restructure mock store handlers and update exports ([49ffe9d8](https://github.com/ucdjs/ucd/commit/49ffe9d8acadaaf2e4eb0704caf9bb9892625426))
* feat(test-utils): enhance mock fetch handlers and add platform detection ([abf7bedb](https://github.com/ucdjs/ucd/commit/abf7bedbb0e6451b206c246c75b5eb31cfc8fc29))
* feat(test-utils): add initial test-utils package (#268) ([#268](https://github.com/ucdjs/ucd/issues/268)) ([d200f56e](https://github.com/ucdjs/ucd/commit/d200f56e102f61d2d8b8820c8ad50fd57dd6c053))

### Miscellaneous

* fix ([a765b117](https://github.com/ucdjs/ucd/commit/a765b1173889e3f74e0f1c68ef2f077804679904))

### undefined

* refactor(test-utils): reorder MOCK_ROUTES for clarity ([8c1366cc](https://github.com/ucdjs/ucd/commit/8c1366cc3650da4fdcc7bbd57bf8ba1d18a5136b))
* refactor(test-utils): rename CONFIGURED_RESPONSE to kConfiguredResponse ([e2e9e84c](https://github.com/ucdjs/ucd/commit/e2e9e84c4eb5edff49b09415fafa83bbb7e55dd3))
* refactor(test-utils): remove unused `wrapMockFetchWithConfig` function ([c58c92d7](https://github.com/ucdjs/ucd/commit/c58c92d770c2b0324987beed2e82e96377a8ed1b))
* refactor(test-utils): enhance `isConfiguredResponse` type checking ([9c13e3ae](https://github.com/ucdjs/ucd/commit/9c13e3ae1c7c9eecf693c51aa8c93e3f14231b38))
* refactor(test-utils): remove unused `InferEndpointConfig` import ([5da32d9a](https://github.com/ucdjs/ucd/commit/5da32d9a2cf992ff61145b48f86f8cdb7a1a9b81))
* refactor(test-utils): update `ConfiguredResponse` type to use `ConfiguredResponseConfig` properties ([2993c13f](https://github.com/ucdjs/ucd/commit/2993c13f709e8385470ab20298624351802da3c0))
* refactor(test-utils): enhance `mockStoreApi` with config extraction and wrapped fetch ([6c321d9a](https://github.com/ucdjs/ucd/commit/6c321d9a55c89bb0e4e4d9c9f7299a54700991df))
* refactor(test-utils): export `configure` alongside `mockStoreApi` ([5fdd77a3](https://github.com/ucdjs/ucd/commit/5fdd77a3ccfc98ee557f49cf5a86fa1799a23a5e))
* refactor(test-utils): reorganize types and handlers ([129e24a7](https://github.com/ucdjs/ucd/commit/129e24a77dea2066202722bb89f3a782bc367fd8))
* refactor(test-utils): enhance mswPath generation for endpoint handling ([ed720b81](https://github.com/ucdjs/ucd/commit/ed720b816888f5288dac1d03aa2e8e17f81b87c8))
* refactor(test-utils): improve type inference for responses ([ead27917](https://github.com/ucdjs/ucd/commit/ead2791726eadc5c045f06735a409fdbadd98d0b))
* refactor(test-utils): refactor mock store handlers and remove unused types ([b6271135](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658))
* refactor(test-utils): move `name` and `description` into `meta` object ([eab09e41](https://github.com/ucdjs/ucd/commit/eab09e41ce84adc0407e35ea9aa151d5bdfcd433))
* refactor(test-utils): rename `setupMockStore` to `mockStoreApi` ([36bd17a2](https://github.com/ucdjs/ucd/commit/36bd17a29d2f15c3ab6c2ca0bf86e0bfee8ee7ea))
* refactor(test-utils): reorganize MSW setup and mockFetch implementation ([b9be7b04](https://github.com/ucdjs/ucd/commit/b9be7b04b4a6f167680d9750fefd168584521bd6))
