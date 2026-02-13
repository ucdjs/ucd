# @ucdjs/client

## 0.2.0




### &nbsp;&nbsp;&nbsp;🚀 Features

- add new ucd client &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d4ea6d9f)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d4ea6d9feb9dcd9cdb0394ab27323be980d2303c)
- **api**:
      - refactor manifest generation and upload process &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9a07f326)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9a07f326dc1f69fecc1615307f31d3f4cf5949f5)  - **client**:
      - add protection again path traversal &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(12110cef)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/12110cef71c3a0cb0e902703fc750849d596a6fb)    - validate using zod schemas &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(67669c9a)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/67669c9a940b31ef83e07cbe6276924657f28747)    - enhance UCD client with config and manifest resources &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b4d8fbad)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b4d8fbadb57970eea7c0b3cb01583fa7d860f2b6)    - add discoverEndpointsFromConfig function and tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(f196cb25)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/f196cb2588ca0ab8b5115e63e4f115a84b51701c)  - **shared**:
      - add `isApiError` type guard and tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(5b578e55)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/5b578e55b6ef15fe05b5e62bf759d6d4f5543a8d)  - **ucd-store**:
      - enhance UCD client initialization and error handling &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(224c22ed)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/224c22ed0fa2ad6483bb72f512965b9792fc7d1d)  
### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes


- **api**:
      - update manifest endpoint reference in files resource &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(06e54ad4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/06e54ad495be3a07e9067b2766065a65d9eb6a10)  - **ucd-store-v2**:
      - update return type for `get` method and remove generic type from `getManifest` &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(31ba5a66)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/31ba5a665b27877fc6d78f9d3934319b6ff5b782)  
### &nbsp;&nbsp;&nbsp;Documentation

- restructure client documentation and enhance installation instructions &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(4ffb68f9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/4ffb68f9c60fc4028ab1005735fc938d4268efee)

### &nbsp;&nbsp;&nbsp;Refactoring

- reorganize pnpm catalogs for better scoping &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(ba721776)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/ba721776cf6fad9cdae2ba9617e52fca7dff1499)- remove deprecated ucd-store.json endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(9d94bacf)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/9d94bacfde07fe1997a2db36de08eac5380b8183)- rename @ucdjs/fetch to @ucdjs/client &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(396f59f1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/396f59f1554aff152f2f34848b670bc318f2e06a)
- **ucd-store-v2**:
      - complete test structure refactor and enhance test coverage &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(99163240)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/99163240c03b9d52f3db3e26dce9f97863bb9433)    - improve error handling and response processing &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(248a0dc4)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/248a0dc4ade38163afdb71beca6567d94a2357a0)  - **api**:
      - remove deprecated well-known routes and update manifest endpoint &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(1fe0d558)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/1fe0d558fa35373f7794ab549c8d0b774b1107d4)  - **test-utils**:
      - refactor mock store handlers and remove unused types &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(b6271135)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658)  - **client**:
      - streamline UCD client creation &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(999ff6f1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/999ff6f132b89075bc90b9029bae5769c27a4626)    - remove export of discoverEndpointsFromConfig &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(97bf29fb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/97bf29fb873752067226b5dfa85dfbb7270f98b4)    - update createVersionsResource to use unified endpoints configuration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(bdb1a39e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/bdb1a39e81c4443d89b6534ce8229b71de6bc25b)    - replace hardcoded paths with endpoint references &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0c65da4b)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0c65da4bbb72e18d5a77c1f3c1ab338463417981)    - refactor createFilesResource to use unified endpoints configuration &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(899dffbb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/899dffbb90aaac939a4302d11ce4b9ff7882d1bc)    - remove pre-configured client instance and update tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(0d2a30fb)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/0d2a30fb6de590c0997fe16dad0cbd9620c46fbd)  - **shared,client**:
      - move ucd-config from client to shared &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(d6094c9e)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/d6094c9e9edf5f2f06c86d737ae1b4f3d16b6d7c)  
### &nbsp;&nbsp;&nbsp;Tests


- **client**:
      - update base URL handling in version tests &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(dbb50a2c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/dbb50a2ca3b7afa04742b45079afbd51d8a44124)    - improve testing &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(96d49dd3)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/96d49dd3f6f69e49dd18fdc78b8d7eb788ac3816)    - simplify invalid version format tests for manifest resource &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(da5bf1d1)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/da5bf1d18a48f9081ddd13cd1e7ca28cceff3e1c)    - update file and version resource tests to use destructured response &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(30d6cba9)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/30d6cba975707a9c1c1545d000eabff3c86807c5)    - update client tests to reflect new client changes &amp;nbsp;-&amp;nbsp; by Lucas [&lt;samp&gt;(91ad723c)&lt;/samp&gt;](https://github.com/ucdjs/ucd/commit/91ad723caab81c21985c29e04ad8e9f90fcadb3a)  


##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](https://github.com/ucdjs/ucd/compare/v0.1.0...v0.2.0)

## 0.1.0

### Minor Changes

- [#325](https://github.com/ucdjs/ucd/pull/325) [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868) Thanks [@luxass](https://github.com/luxass)! - Move `discoverEndpointsFromConfig` from `@ucdjs/client` to `@ucdjs-internal/shared`.

- [#81](https://github.com/ucdjs/ucd/pull/81) [`670ccf9`](https://github.com/ucdjs/ucd/commit/670ccf97acfd893b75180ce7158314db653c4976) Thanks [@luxass](https://github.com/luxass)! - feat: add fetch client

### Patch Changes

- [#155](https://github.com/ucdjs/ucd/pull/155) [`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e) Thanks [@luxass](https://github.com/luxass)! - update types to match api types

- [`e98b9e8`](https://github.com/ucdjs/ucd/commit/e98b9e8a443b815ce38b6f0a94314a2bb982dd77) Thanks [@luxass](https://github.com/luxass)! - chore: remove path property of ApiError #141

- Updated dependencies [[`d031fdc`](https://github.com/ucdjs/ucd/commit/d031fdc4426120e901f7f26072c17d2de2f3bd59), [`3dfaaae`](https://github.com/ucdjs/ucd/commit/3dfaaaebfbf4f03c0d9755db3fa0601ff825fbce), [`384810a`](https://github.com/ucdjs/ucd/commit/384810a92e9f68f207b349177842149e758e5813), [`696fdd3`](https://github.com/ucdjs/ucd/commit/696fdd340a2b2faddfcd142e285294f1cc715c1a), [`7e8a4a7`](https://github.com/ucdjs/ucd/commit/7e8a4a7b0511af98b87a6004e479cdc46df570c5), [`6c564ab`](https://github.com/ucdjs/ucd/commit/6c564aba7670bd2f5d98e9720828031bb8eb0532), [`a028d2f`](https://github.com/ucdjs/ucd/commit/a028d2f37091a90c76c66ca8c10e43b45b999868), [`6b59312`](https://github.com/ucdjs/ucd/commit/6b5931201a9a19a1b8d70f25680e22d4ae0f0743), [`08189be`](https://github.com/ucdjs/ucd/commit/08189be0432803fe77ab19d9855b38aadaea5459), [`71d58fb`](https://github.com/ucdjs/ucd/commit/71d58fbf37f580e54a42600dcc4c71f3a63443c0), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`a9e3aae`](https://github.com/ucdjs/ucd/commit/a9e3aae0efd15e07c50b58b827857631f0553640)]:
  - @ucdjs-internal/shared@0.1.0
  - @ucdjs/env@0.1.0
  - @ucdjs/schemas@0.1.0
