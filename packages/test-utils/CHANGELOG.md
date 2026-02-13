# @ucdjs/test-utils

## 1.1.0




### &nbsp;&nbsp;&nbsp;🚀 Features

- add `RawResponse` to support responses without content-type header set. &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(58fcb080)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/58fcb0808f38057c693aaf20a2409b7a0bd78579)- support openapi path params in mockFetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c61d6661)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c61d6661b65e1d43ddfc6db128d7e2610293bd0c)- add support setting before and after functions via configure &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d83981ec)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d83981ecd6833776b3c498e8b39ceee26c61ae55)
- **pipeline-loader**:
      - add oxc-parser and picomatch dependencies &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f22052af)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f22052af0b7c39d908eee5fd480e89c2acc614df)  - **test-utils**:
      - add pipeline module source and exports &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6250329d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6250329dadada43dc10c5e036d23e2158b0d48c9)    - add async iterable utilities and tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(30cc648d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/30cc648d18806edb810918f3716cb6ce33d32849)    - integrate @unicode-utils/core and enhance file handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4c2d2df4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4c2d2df4254b57868fa6f16cd39b3278d4458c4a)    - add file path handling and tree structure utilities &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(47862911)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/478629110dc01283d3307b1fa1caed1a4fc3fd11)    - add mock content &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f71c644f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f71c644fe3f3c51913cad792b7e44fb73984141e)    - add @luxass/utils dependency &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(30400f34)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/30400f3437c60e9832de2250d0a3fa995c19972a)    - add support for error fields validation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1b20f27e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1b20f27e848599a3a6348798b7d1328c9dddeb17)    - add basePath option to memory file system bridge &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(fe114474)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/fe11447472d0bd575bd132f58c9dbdcd82f707a4)    - enhance error message matching in response matcher &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c926df37)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c926df37b2ecdace29a8c41907699c254add56be)    - add custom response matchers for API error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(bff3f2af)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/bff3f2af4a3391c17fbb1f0602383fc3b63393d8)    - add exports for matchers types and Vitest setup &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b5014167)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b501416787a6743be64c9f5bfa1229cd5660e97e)    - add custom error matcher and update Vitest setup &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(647a592b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/647a592bcbfc82eade3559df3113f9f4c8707745)    - implement mkdir for memory-fs-bridge &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a93dcf8a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a93dcf8a20a1868d688b0db766f50a0e086730c5)    - add intellisense for files version &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(db3c3335)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/db3c3335ac701b5beee03a60bee947928c16f121)    - add support for setting files &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(590e8296)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/590e829688863280bd9027f4d1bd4ba1b6941121)    - add ApiError auto-conversion and related tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1d2aa933)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1d2aa933b17d21714edc799ba32edbeb9cbc5ab8)    - update callback payload types for wrapMockFetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1feca597)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1feca5976618820c3cbdacf24754e3ca22730cbf)    - enhance mockStoreApi with debugging and improved request handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(793dcdec)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/793dcdecf9a9d9d756fa2e9bc71e10133b687b73)    - add onRequest callback to mockStoreApi and wrapMockFetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(fa97b58d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/fa97b58da28958ad254caa66e0cd123dd15a651f)    - add support for custom mock fetch handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(cb719a30)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/cb719a3048336496f56f8e57f1aa46932e9e40a1)    - enhance response handling with `configure` and `unsafeResponse` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e3cf3525)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e3cf3525a773d79bebe06599e8767919b53360f0)    - add tests for `unsafeResponse` functionality &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(2c30435e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2c30435e337db136f797d992161937d5b4634874)    - add `unsafeResponse` function for testing edge cases &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e2f10ee6)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e2f10ee642f4a7fd5776f2efaea6a547eaa94a12)    - normalize root path handling in memory file system bridge &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a1b73221)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a1b73221b5a9c0082e61c355babd94c05674bf7f)    - enhance directory structure handling in memory file system bridge &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8f327e8f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8f327e8fb384332cd91fbeb3186f08a859de7fe4)    - add in-memory file system bridge implementation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8bde966f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8bde966f5b12e43d5cb3e90ea63be9f1ceb955fd)    - add fs-bridges entry to tsdown configuration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8f982761)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8f982761a2e86d5aaf556685efdc521d61aee026)    - add mockFetch function for MSW integration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0ffc6768)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0ffc6768d3360b1e9f0507c70843eb9b58027a1f)    - add mockFetch to handler functions and improve setupMockStore &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6af022c3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6af022c3d29494d37378ca30ca72df82faa25e5b)    - restructure mock store handlers and update exports &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(49ffe9d8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/49ffe9d8acadaaf2e4eb0704caf9bb9892625426)    - enhance mock fetch handlers and add platform detection &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(abf7bedb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/abf7bedbb0e6451b206c246c75b5eb31cfc8fc29)    - add initial test-utils package &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(d200f56e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d200f56e102f61d2d8b8820c8ad50fd57dd6c053)  - **api**:
      - refactor manifest generation and upload process &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9a07f326)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9a07f326dc1f69fecc1615307f31d3f4cf5949f5)  - **ucd-store-v2**:
      - introduce read-only filesystem bridge and enhance test coverage &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a0e421d2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a0e421d2be13b805a32fb3ec84b5f4ffb7c6beb7)  - **mock-store**:
      - add well-known handler for UCD configuration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(15212df0)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/15212df0a3a0637671e8e5a53a4f606d9b031d33)  - **shared**:
      - add custom fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d66c2282)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a)  
### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes

- update file paths to include &#39;extracted&#39; prefix &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(2f455a5f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243)- switch behaviour &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(70a2b8df)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/70a2b8df611fcf2041c1f41a1d05171a19541c91)- handle wildcard params differently &amp;nbsp;-&amp;nbsp; by Lucas Nørgård [&lt;samp&gt;(43640a1e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/43640a1e2a905f669708a76c8193558429d36df3)
- **test-utils**:
      - improve error handling in toMatchError matcher &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a7cb1e08)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a7cb1e08ca81931553d5d53d579e5571501f5d0c)    - use `:wildcard*` in route handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(fd0d0bfd)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/fd0d0bfdbfb2f9984674f702a1411876cec20da6)    - use correct files type &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(47de85d6)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/47de85d656fa4ee7af5216d0b71bd2ac0144964e)    - flatten files in well-known expected files &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f0de5248)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f0de5248a56c2c14029d0ce8400ead6ba8e3dbd1)    - update wildcard route handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c662bec8)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c662bec8429c98e5fd98942e2c12f0e6fd479d51)    - improve debug message for wrapMockFetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(04a939cc)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/04a939cccd06940d42946a7cf72360f597ae62d5)    - improve header handling in `afterFetch` for response &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(34dc1f4c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/34dc1f4cdabed4651ede28b14eacb4da20b29d04)    - update `Params` type in `TypedResponseResolver` for better type safety &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(dd0c510c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/dd0c510ccad61cf9a481f770b25dc1305dc5d474)    - improve TypeScript type inference for providedResponse &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(bfd05075)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/bfd0507535db0bc01bc367bf918ff5f91f9c78ff)    - adjust latency expectation in tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0caa3e94)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0caa3e9409e9ac397ac495c2f37b5a028a39be7a)    - improve response validation and error message &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ff437240)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ff4372408f96a19fda604c733879d05225d24c48)    - improve header handling in `wrapMockFetchWithConfig` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6aaf8a17)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6aaf8a17b5edf7580c44d25b3cf7af737f0af14b)    - rename `setupMockStore` to `mockStoreApi` for clarity &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(80f2d4a3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/80f2d4a39aeaaad853206fb05b358f7911f32258)    - cast response to HttpResponseResolver in handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9d01beb5)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9d01beb56201f0d19484e46112285600926b9371)    - normalize base URL correctly &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ad160737)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ad16073723399deabbfa019836d00d4d29094ba6)    - update vitest-setup path and improve setupMockStore return type &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c9b2a1cd)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c9b2a1cdadecf0262fa6dc7870db9341544d59ba)  - **api**:
      - update manifest endpoint reference in files resource &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(06e54ad4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/06e54ad495be3a07e9067b2766065a65d9eb6a10)  - **ucd-store-v2**:
      - ensure &#39;read:before&#39; hook is correctly set up &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e2831585)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e2831585ef825a2f11ba90bee18f1631a9c36804)  
### &nbsp;&nbsp;&nbsp;Refactoring

- reorganize pnpm catalogs for better scoping &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ba721776)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ba721776cf6fad9cdae2ba9617e52fca7dff1499)- remove deprecated ucd-store.json endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9d94bacf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9d94bacfde07fe1997a2db36de08eac5380b8183)- rename tryCatch to wrapTry &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c71e6b11)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c71e6b11a5ee0e21747f887a5e5b9546993417e2)
- **test-utils**:
      - update custom manifest structure in tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ec8ad131)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ec8ad1310a8d861ad666d655f92e71a62556952a)    - standardize path formatting in memory fs bridge &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(203abcbf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/203abcbfc4403368489985105d439da608a913a5)    - simplify content handling in filesRoute &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(84fb9053)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/84fb905368cafa51cc84701180fd96e9da1f26e2)    - remove unused import from files handler &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1f17593e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1f17593e8c58b7db878f5800bcc2407a5c2f824a)    - use Object.keys for data iteration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(2340ed95)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2340ed954e3c1b23051335eff1ca48495be49492)    - improve error message matching logic &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0a2b79b2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0a2b79b25c77c9b3787d24423e88770d265ac818)    - remove unused HeadersOptions interface &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(fe7ec72d)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/fe7ec72d88827731d2fc07de73251b5e899c547c)    - reorder MOCK_ROUTES for clarity &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(8c1366cc)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/8c1366cc3650da4fdcc7bbd57bf8ba1d18a5136b)    - rename CONFIGURED_RESPONSE to kConfiguredResponse &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e2e9e84c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e2e9e84c4eb5edff49b09415fafa83bbb7e55dd3)    - remove unused `wrapMockFetchWithConfig` function &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c58c92d7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c58c92d770c2b0324987beed2e82e96377a8ed1b)    - enhance `isConfiguredResponse` type checking &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9c13e3ae)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9c13e3ae1c7c9eecf693c51aa8c93e3f14231b38)    - remove unused `InferEndpointConfig` import &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5da32d9a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5da32d9a2cf992ff61145b48f86f8cdb7a1a9b81)    - update `ConfiguredResponse` type to use `ConfiguredResponseConfig` properties &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(2993c13f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/2993c13f709e8385470ab20298624351802da3c0)    - enhance `mockStoreApi` with config extraction and wrapped fetch &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(6c321d9a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/6c321d9a55c89bb0e4e4d9c9f7299a54700991df)    - export `configure` alongside `mockStoreApi` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5fdd77a3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5fdd77a3ccfc98ee557f49cf5a86fa1799a23a5e)    - reorganize types and handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(129e24a7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/129e24a77dea2066202722bb89f3a782bc367fd8)    - enhance mswPath generation for endpoint handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ed720b81)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ed720b816888f5288dac1d03aa2e8e17f81b87c8)    - improve type inference for responses &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ead27917)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ead2791726eadc5c045f06735a409fdbadd98d0b)    - refactor mock store handlers and remove unused types &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b6271135)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658)    - move `name` and `description` into `meta` object &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(eab09e41)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/eab09e41ce84adc0407e35ea9aa151d5bdfcd433)    - rename `setupMockStore` to `mockStoreApi` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(36bd17a2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/36bd17a29d2f15c3ab6c2ca0bf86e0bfee8ee7ea)    - reorganize MSW setup and mockFetch implementation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b9be7b04)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b9be7b04b4a6f167680d9750fefd168584521bd6)  - **ucd-store**:
      - remove unnecessary parameters in mock route handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(c162e666)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/c162e6664dad99b319c6001956593fa46e56cdaa)    - migrate to store subdomain for file access &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ff4184fa)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ff4184fa1a563973e5ebd5aa094baa6beac42b13)  - **utils**:
      - remove unused type `TreeEntry` from exports &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f1e82e6c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f1e82e6cbe71932122a8dfe705d52e360cac4b7d)  - **ucd-store-v2**:
      - complete test structure refactor and enhance test coverage &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(99163240)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/99163240c03b9d52f3db3e26dce9f97863bb9433)  - **api**:
      - remove deprecated well-known routes and update manifest endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1fe0d558)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1fe0d558fa35373f7794ab549c8d0b774b1107d4)  
### &nbsp;&nbsp;&nbsp;Tests

- update manifest structure to include `expectedFiles` for version entries &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4d8dad56)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4d8dad56aef6f0fb072e269e05b6bc40dc90d4ac)
- **test-utils**:
      - update expected paths in listdir tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(49dd39e7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/49dd39e7711ea619bf3aa34cf3f0a908709c4395)    - add comprehensive tests for mockStoreApi handlers &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(913279e7)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/913279e72664aedd61e7f56400a172e4a38ee530)    - enhance mockStoreApi tests with custom responses &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(81f5b4fb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/81f5b4fb0a1ddb288a10a1a5116bca61f17ede4a)    - accept true in configure() error message &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d58810bf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d58810bf791530438f3b1f9731e9eb69cf9dadae)    - enhance wrapMockFetch with onRequest, beforeFetch, and afterFetch callbacks &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(e0e5f693)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/e0e5f6932ae93a0a079673785099a484ffd5c81e)    - add support for custom responses in mockStoreApi &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d354e060)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d354e06003ac1e9479d242277b9435c2da3d4b90)    - add comprehensive tests for mockStoreApi functionality &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(585652a2)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/585652a2ff5c32ce8ab904b2af5f37066e8c5d61)    - add comprehensive tests for response configuration and utility functions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a2d505cf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a2d505cff4535b12470135d061949e3b7cd5b795)    - add comprehensive tests for `mockStoreApi` functionality &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d274ac66)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d274ac662eeb2903862e7bc6fa168782674d15e7)    - add comprehensive tests for memory file system operations &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(09dc510e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/09dc510e922f1c2e240e644e9d14d75fa46870ad)  

### &nbsp;&nbsp;&nbsp;Utils
- add functions overrides to createMemoryMockFS (support false to disable) &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(a9185669)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/a9185669c57f3debc7bd75b132f97a4a5aa91bc8)

##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/v1.0.0...v1.1.0)

## 1.0.0

### Minor Changes

- [#359](https://github.com/ucdjs/ucd/pull/359) [`74e889a`](https://github.com/ucdjs/ucd/commit/74e889ad3724ece96ef2fb65ca4442ef8573a822) Thanks [@luxass](https://github.com/luxass)! - Added `configure` helper for customizing mock responses with latency and headers.

  The new `configure` helper allows you to simulate network latency and add custom headers to mock responses:

  ```ts
  import { mockStoreApi, configure } from "@ucdjs/test-utils";

  mockStoreApi({
    responses: {
      "/api/v1/versions": configure({
        response: [{ version: "16.0.0" /* ... */ }],
        latency: 100, // 100ms delay
        headers: { "X-Custom-Header": "value" },
      }),
    },
  });
  ```

  **Features:**

  - **Fixed latency**: Use a number for consistent delay
  - **Random latency**: Use `"random"` for variable 100-999ms delays
  - **Custom headers**: Add response headers for testing

  **Examples:**

  ```ts
  // Random latency for realistic testing
  configure({
    response: data,
    latency: "random", // Random 100-999ms
  });

  // Test rate limiting headers
  configure({
    response: data,
    headers: {
      "X-Rate-Limit-Remaining": "10",
      "X-Rate-Limit-Reset": "1234567890",
    },
  });

  // Combine latency and headers
  configure({
    response: data,
    latency: 200,
    headers: { "X-Request-ID": "test-123" },
  });
  ```

- [#362](https://github.com/ucdjs/ucd/pull/362) [`2c6d845`](https://github.com/ucdjs/ucd/commit/2c6d84513fd0ca2f1eda3d8f502114770f3dbe3e) Thanks [@luxass](https://github.com/luxass)! - Added `customResponses` option to `mockStoreApi` for registering custom endpoint handlers.

  You can now add custom endpoints beyond the predefined API routes:

  ```ts
  import { mockStoreApi } from "@ucdjs/test-utils";
  import { HttpResponse } from "msw";

  mockStoreApi({
    customResponses: [
      [
        "GET",
        "https://api.ucdjs.dev/api/v1/stats",
        () => {
          return HttpResponse.json({ totalVersions: 42 });
        },
      ],
    ],
  });
  ```

  **Features:**

  - Support for custom endpoints with any HTTP method
  - Multiple methods on the same endpoint
  - Path parameters support
  - Works alongside regular `responses` configuration

  **Examples:**

  ```ts
  // Multiple HTTP methods
  mockStoreApi({
    customResponses: [
      [
        ["POST", "PUT"],
        "https://api.ucdjs.dev/api/v1/cache",
        ({ request }) => {
          return HttpResponse.json({ method: request.method });
        },
      ],
    ],
  });

  // Path parameters
  mockStoreApi({
    customResponses: [
      [
        "GET",
        "https://api.ucdjs.dev/api/v1/versions/:version/stats",
        ({ params }) => {
          return HttpResponse.json({ version: params.version, downloads: 100 });
        },
      ],
    ],
  });

  // Combine with regular responses
  mockStoreApi({
    responses: {
      "/api/v1/versions": [],
    },
    customResponses: [
      [
        "GET",
        "https://api.ucdjs.dev/api/v1/search",
        () => {
          return HttpResponse.json({ results: [] });
        },
      ],
    ],
  });
  ```

  This is useful for testing custom endpoints or extending the mock API with additional functionality.

- [#359](https://github.com/ucdjs/ucd/pull/359) [`74e889a`](https://github.com/ucdjs/ucd/commit/74e889ad3724ece96ef2fb65ca4442ef8573a822) Thanks [@luxass](https://github.com/luxass)! - Added support for error responses in mock store using `ApiError` type from `@ucdjs/schemas`.

  You can now return API error responses to test error handling scenarios:

  ```ts
  import { mockStoreApi } from "@ucdjs/test-utils";
  import type { ApiError } from "@ucdjs/schemas";

  const errorResponse: ApiError = {
    message: "Version not found",
    status: 404,
    timestamp: new Date().toISOString(),
  };

  mockStoreApi({
    responses: {
      "/api/v1/versions": errorResponse,
    },
  });
  ```

  This makes it easier to test error handling while maintaining full type safety with the standardized API error format.

- [#364](https://github.com/ucdjs/ucd/pull/364) [`13b3900`](https://github.com/ucdjs/ucd/commit/13b390035620daf2053c6be8c25d602deed579f2) Thanks [@luxass](https://github.com/luxass)! - Added `onRequest` callback to `mockStoreApi` for request tracking.

  The `onRequest` callback allows tests to track, assert, or log API requests. This is particularly useful for verifying that certain endpoints weren't called during a test, such as when testing local caching behavior.

  ```ts
  import { mockStoreApi } from "@ucdjs/test-utils";

  let apiCallCount = 0;

  mockStoreApi({
    versions: ["16.0.0"],
    onRequest: ({ path, method, params, url }) => {
      apiCallCount++;
      console.log(`API called: ${method} ${path}`);
    },
  });

  // Later in test
  expect(apiCallCount).toBe(0); // Verify API wasn't called
  ```

  **Features:**

  - Track API requests during tests
  - Access request metadata: `path`, `method`, `params`, `url`
  - Verify endpoints weren't called (e.g., when using local caches)

  This resolves issue #363.

- [#359](https://github.com/ucdjs/ucd/pull/359) [`74e889a`](https://github.com/ucdjs/ucd/commit/74e889ad3724ece96ef2fb65ca4442ef8573a822) Thanks [@luxass](https://github.com/luxass)! - Added `unsafeResponse` helper for testing with invalid or non-schema-compliant responses.

  The new `unsafeResponse` helper bypasses TypeScript type checking to test error handling with invalid data:

  ```ts
  import { mockStoreApi, unsafeResponse } from "@ucdjs/test-utils";

  // Test error handling with malformed response
  mockStoreApi({
    responses: {
      "/api/v1/versions": unsafeResponse({ invalid: "data" }),
    },
  });
  ```

  **Use Cases:**

  - Test error handling with malformed API responses
  - Simulate edge cases where the API returns unexpected data
  - Validate client-side validation and error recovery

  **Combine with `configure`:**

  ```ts
  import { mockStoreApi, configure, unsafeResponse } from "@ucdjs/test-utils";

  mockStoreApi({
    responses: {
      "/api/v1/versions": configure({
        response: unsafeResponse({ malformed: "response" }),
        latency: 100,
        headers: { "X-Test-Case": "invalid-response" },
      }),
    },
  });
  ```

  This is useful for testing how your application handles unexpected API behavior.

- [#295](https://github.com/ucdjs/ucd/pull/295) [`7187763`](https://github.com/ucdjs/ucd/commit/71877636a5be78f5e7a867511b78f1fc006f4eaa) Thanks [@luxass](https://github.com/luxass)! - Rename `mockStoreApi` to `mockStoreApi` for better clarity

  The function has been renamed from `mockStoreApi` to `mockStoreApi` to better reflect that it sets up MSW HTTP route handlers for the UCD API, rather than creating a mock store object.

  **Migration:**

  ```typescript
  // Before
  import { mockStoreApi } from "@ucdjs/test-utils";
  mockStoreApi();

  // After
  import { mockStoreApi } from "@ucdjs/test-utils";
  mockStoreApi();
  ```

  The old `mockStoreApi` name is still exported as a deprecated alias for backward compatibility.

- [#292](https://github.com/ucdjs/ucd/pull/292) [`956277e`](https://github.com/ucdjs/ucd/commit/956277ec63983735e072f210cfd896de4e6bfe99) Thanks [@luxass](https://github.com/luxass)! - Reorganize package structure and improve MSW server flexibility

  **Package Structure:**

  - Reorganized into `mock-store/` directory with cleaner file structure
  - Renamed `global-setup.ts` to `vitest-setup.ts` for clarity
  - Simplified handler pattern by removing abstraction layer
  - Consolidated all types into `mock-store/types.ts`

  **MSW Server Improvements:**

  - `mockStoreApi` now accepts optional `mswServer` parameter for custom MSW servers
  - Smart server resolution: automatically uses global server when `@ucdjs/test-utils/msw/vitest-setup` is imported
  - Handlers now receive `mockFetch` via dependency injection for better testability
  - Clear error messages when MSW server is not configured

  **Usage:**

  ```typescript
  // Option 1: Use vitest-setup (automatic server registration)
  // vitest.config.ts
  export default defineConfig({
    test: {
      setupFiles: ["@ucdjs/test-utils/msw/vitest-setup"],
    },
  });

  // Option 2: Provide your own server
  mockStoreApi({ mswServer: yourCustomServer });
  ```

- [#332](https://github.com/ucdjs/ucd/pull/332) [`d621f55`](https://github.com/ucdjs/ucd/commit/d621f552259984f13d14322c91745e52c4a6d77f) Thanks [@luxass](https://github.com/luxass)! - Add in-memory file system bridge for testing

  Introduces `createMemoryMockFS` under `@ucdjs/test-utils/fs-bridges` - a lightweight, Map-based in-memory file system bridge for testing file operations without real I/O.

  **Usage:**

  ```typescript
  import { describe, it, expect } from "vitest";
  import { createMemoryMockFS } from "@ucdjs/test-utils/fs-bridges";

  describe("file operations", () => {
    it("should read and write files", async () => {
      const fs = createMemoryMockFS();

      await fs.write("test.txt", "content");
      const content = await fs.read("test.txt");

      expect(content).toBe("content");
    });

    it("should initialize with pre-populated files", async () => {
      const fs = createMemoryMockFS({
        initialFiles: {
          "manifest.json": JSON.stringify({ versions: ["16.0.0"] }),
          "16.0.0/UnicodeData.txt": "0000;<control>;Cc;0;BN;;;;;N;NULL;;;;",
        },
      });

      expect(await fs.exists("manifest.json")).toBe(true);
      expect(await fs.exists("16.0.0/UnicodeData.txt")).toBe(true);
    });
  });
  ```

  Supports all file system operations: `read`, `write`, `exists`, `listdir`, `mkdir`, `rm`. Full write/read/mkdir/rm capabilities included.

- [#359](https://github.com/ucdjs/ucd/pull/359) [`74e889a`](https://github.com/ucdjs/ucd/commit/74e889ad3724ece96ef2fb65ca4442ef8573a822) Thanks [@luxass](https://github.com/luxass)! - Changed mock store route parameter syntax from Express-style (`:param`) to OpenAPI-style (`{param}`).

  **Breaking Changes:**

  Route definitions now use curly braces for parameters instead of colons.

  **Before:**

  ```ts
  mockStoreApi({
    responses: {
      "/api/v1/files/:wildcard": customData,
    },
  });
  ```

  **After:**

  ```ts
  mockStoreApi({
    responses: {
      "/api/v1/files/{wildcard}": customData,
    },
  });
  ```

  This aligns the mock store with OpenAPI path parameter conventions and improves consistency across the codebase.

### Patch Changes

- [#291](https://github.com/ucdjs/ucd/pull/291) [`6164ec5`](https://github.com/ucdjs/ucd/commit/6164ec523993459e5edf2cce4d2f3378bb84653c) Thanks [@luxass](https://github.com/luxass)! - Align @ucdjs/test-utils with internal test utils

- Updated dependencies [[`6ac0005`](https://github.com/ucdjs/ucd/commit/6ac000515509945cc87119af57725beabc9b75e4), [`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f), [`199021b`](https://github.com/ucdjs/ucd/commit/199021b803ffe5969f8c5e80de3153971b686b69), [`8ed7777`](https://github.com/ucdjs/ucd/commit/8ed77771808dc56a7dc3a1f07bd22cd7b75c2119), [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31), [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`ce9b5a7`](https://github.com/ucdjs/ucd/commit/ce9b5a76795292aca5c9f8b6fd7021a66a34c28d), [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946), [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f), [`942dc38`](https://github.com/ucdjs/ucd/commit/942dc380eb97e7123a5aa32e2960f6fef505465d), [`7c612b3`](https://github.com/ucdjs/ucd/commit/7c612b3985a09f65348fa00fb86dba3e11157eec), [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea), [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0), [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e), [`d02d0c6`](https://github.com/ucdjs/ucd/commit/d02d0c6bdf7fc990c56e55a9e2517eba40b7e0b3), [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1), [`46a6e81`](https://github.com/ucdjs/ucd/commit/46a6e8110dcc1ccef3a436bb18e67d92f0424213), [`7d98e29`](https://github.com/ucdjs/ucd/commit/7d98e29af2f9f6d681f9f2ee401baddf5a2c6ef6), [`2a44473`](https://github.com/ucdjs/ucd/commit/2a444735b6c09b4a5df8c79a580d00acb7511ab2), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`4fd46b4`](https://github.com/ucdjs/ucd/commit/4fd46b43613b23c1d120c71ae0754883eb9bf1ff), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`0360dc3`](https://github.com/ucdjs/ucd/commit/0360dc3ac727019d451768dd1ef6eadca572c69b), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`39faaf5`](https://github.com/ucdjs/ucd/commit/39faaf585f3339296ef75c8a39893399ea48789f), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`da10e4d`](https://github.com/ucdjs/ucd/commit/da10e4d133819b08c83d60d63d82d9273a1f77a3), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`5bc90eb`](https://github.com/ucdjs/ucd/commit/5bc90ebcf5e20e11f4d209983975fa732d57cc3f), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640), [`170bbd1`](https://github.com/ucdjs/ucd/commit/170bbd1a8cfe23787d73e1052108261bb5956d01), [`3993a30`](https://github.com/ucdjs/ucd/commit/3993a304795d26070df7d69ca7b66b226372a234), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/fs-bridge@0.1.0
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/ucd-store@0.1.0
  - @ucdjs/schemas@0.1.0
