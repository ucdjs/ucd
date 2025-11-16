# @ucdjs/test-utils

## [1.1.0](https://github.com/ucdjs/ucd/compare/@ucdjs/test-utils@1.0.0...@ucdjs/test-utils@1.1.0) (2025-11-16)

### Bug Fixes

* ensure 'read:before' hook is correctly set up ([e2831585](https://github.com/ucdjs/ucd/commit/e2831585ef825a2f11ba90bee18f1631a9c36804))
* update file paths to include 'extracted' prefix ([[object Object]](https://github.com/ucdjs/ucd/pull/371)) ([2f455a5f](https://github.com/ucdjs/ucd/commit/2f455a5f8abb5da0e3bc5d1da30b156579b63243))
* update wildcard route handling ([c662bec8](https://github.com/ucdjs/ucd/commit/c662bec8429c98e5fd98942e2c12f0e6fd479d51))
* switch behaviour ([70a2b8df](https://github.com/ucdjs/ucd/commit/70a2b8df611fcf2041c1f41a1d05171a19541c91))
* handle wildcard params differently ([43640a1e](https://github.com/ucdjs/ucd/commit/43640a1e2a905f669708a76c8193558429d36df3))
* improve debug message for wrapMockFetch ([04a939cc](https://github.com/ucdjs/ucd/commit/04a939cccd06940d42946a7cf72360f597ae62d5))
* improve header handling in `afterFetch` for response ([34dc1f4c](https://github.com/ucdjs/ucd/commit/34dc1f4cdabed4651ede28b14eacb4da20b29d04))
* update `Params` type in `TypedResponseResolver` for better type safety ([dd0c510c](https://github.com/ucdjs/ucd/commit/dd0c510ccad61cf9a481f770b25dc1305dc5d474))
* improve TypeScript type inference for providedResponse ([bfd05075](https://github.com/ucdjs/ucd/commit/bfd0507535db0bc01bc367bf918ff5f91f9c78ff))
* adjust latency expectation in tests ([0caa3e94](https://github.com/ucdjs/ucd/commit/0caa3e9409e9ac397ac495c2f37b5a028a39be7a))
* improve response validation and error message ([ff437240](https://github.com/ucdjs/ucd/commit/ff4372408f96a19fda604c733879d05225d24c48))
* improve header handling in `wrapMockFetchWithConfig` ([6aaf8a17](https://github.com/ucdjs/ucd/commit/6aaf8a17b5edf7580c44d25b3cf7af737f0af14b))
* rename `setupMockStore` to `mockStoreApi` for clarity ([80f2d4a3](https://github.com/ucdjs/ucd/commit/80f2d4a39aeaaad853206fb05b358f7911f32258))
* cast response to HttpResponseResolver in handlers ([9d01beb5](https://github.com/ucdjs/ucd/commit/9d01beb56201f0d19484e46112285600926b9371))
* normalize base URL correctly ([ad160737](https://github.com/ucdjs/ucd/commit/ad16073723399deabbfa019836d00d4d29094ba6))
* update vitest-setup path and improve setupMockStore return type ([c9b2a1cd](https://github.com/ucdjs/ucd/commit/c9b2a1cdadecf0262fa6dc7870db9341544d59ba))

### Features

* add ApiError auto-conversion and related tests ([1d2aa933](https://github.com/ucdjs/ucd/commit/1d2aa933b17d21714edc799ba32edbeb9cbc5ab8))
* update callback payload types for wrapMockFetch ([1feca597](https://github.com/ucdjs/ucd/commit/1feca5976618820c3cbdacf24754e3ca22730cbf))
* enhance mockStoreApi with debugging and improved request handling ([793dcdec](https://github.com/ucdjs/ucd/commit/793dcdecf9a9d9d756fa2e9bc71e10133b687b73))
* add onRequest callback to mockStoreApi and wrapMockFetch ([fa97b58d](https://github.com/ucdjs/ucd/commit/fa97b58da28958ad254caa66e0cd123dd15a651f))
* add support for custom mock fetch handlers ([cb719a30](https://github.com/ucdjs/ucd/commit/cb719a3048336496f56f8e57f1aa46932e9e40a1))
* enhance response handling with `configure` and `unsafeResponse` ([e3cf3525](https://github.com/ucdjs/ucd/commit/e3cf3525a773d79bebe06599e8767919b53360f0))
* add tests for `unsafeResponse` functionality ([2c30435e](https://github.com/ucdjs/ucd/commit/2c30435e337db136f797d992161937d5b4634874))
* add `unsafeResponse` function for testing edge cases ([e2f10ee6](https://github.com/ucdjs/ucd/commit/e2f10ee642f4a7fd5776f2efaea6a547eaa94a12))
* normalize root path handling in memory file system bridge ([a1b73221](https://github.com/ucdjs/ucd/commit/a1b73221b5a9c0082e61c355babd94c05674bf7f))
* enhance directory structure handling in memory file system bridge ([8f327e8f](https://github.com/ucdjs/ucd/commit/8f327e8fb384332cd91fbeb3186f08a859de7fe4))
* add in-memory file system bridge implementation ([8bde966f](https://github.com/ucdjs/ucd/commit/8bde966f5b12e43d5cb3e90ea63be9f1ceb955fd))
* add fs-bridges entry to tsdown configuration ([8f982761](https://github.com/ucdjs/ucd/commit/8f982761a2e86d5aaf556685efdc521d61aee026))
* add well-known handler for UCD configuration ([15212df0](https://github.com/ucdjs/ucd/commit/15212df0a3a0637671e8e5a53a4f606d9b031d33))
* add custom fetch ([d66c2282](https://github.com/ucdjs/ucd/commit/d66c228298ca96c409d38c81e839784aa8a0a75a))
* add mockFetch function for MSW integration ([0ffc6768](https://github.com/ucdjs/ucd/commit/0ffc6768d3360b1e9f0507c70843eb9b58027a1f))
* add mockFetch to handler functions and improve setupMockStore ([6af022c3](https://github.com/ucdjs/ucd/commit/6af022c3d29494d37378ca30ca72df82faa25e5b))
* restructure mock store handlers and update exports ([49ffe9d8](https://github.com/ucdjs/ucd/commit/49ffe9d8acadaaf2e4eb0704caf9bb9892625426))
* enhance mock fetch handlers and add platform detection ([abf7bedb](https://github.com/ucdjs/ucd/commit/abf7bedbb0e6451b206c246c75b5eb31cfc8fc29))
* add initial test-utils package ([[object Object]](https://github.com/ucdjs/ucd/pull/268)) ([d200f56e](https://github.com/ucdjs/ucd/commit/d200f56e102f61d2d8b8820c8ad50fd57dd6c053))

### Miscellaneous

* fix ([a765b117](https://github.com/ucdjs/ucd/commit/a765b1173889e3f74e0f1c68ef2f077804679904))

### Refactoring

* reorder MOCK_ROUTES for clarity ([8c1366cc](https://github.com/ucdjs/ucd/commit/8c1366cc3650da4fdcc7bbd57bf8ba1d18a5136b))
* rename CONFIGURED_RESPONSE to kConfiguredResponse ([e2e9e84c](https://github.com/ucdjs/ucd/commit/e2e9e84c4eb5edff49b09415fafa83bbb7e55dd3))
* remove unused `wrapMockFetchWithConfig` function ([c58c92d7](https://github.com/ucdjs/ucd/commit/c58c92d770c2b0324987beed2e82e96377a8ed1b))
* enhance `isConfiguredResponse` type checking ([9c13e3ae](https://github.com/ucdjs/ucd/commit/9c13e3ae1c7c9eecf693c51aa8c93e3f14231b38))
* remove unused `InferEndpointConfig` import ([5da32d9a](https://github.com/ucdjs/ucd/commit/5da32d9a2cf992ff61145b48f86f8cdb7a1a9b81))
* update `ConfiguredResponse` type to use `ConfiguredResponseConfig` properties ([2993c13f](https://github.com/ucdjs/ucd/commit/2993c13f709e8385470ab20298624351802da3c0))
* enhance `mockStoreApi` with config extraction and wrapped fetch ([6c321d9a](https://github.com/ucdjs/ucd/commit/6c321d9a55c89bb0e4e4d9c9f7299a54700991df))
* export `configure` alongside `mockStoreApi` ([5fdd77a3](https://github.com/ucdjs/ucd/commit/5fdd77a3ccfc98ee557f49cf5a86fa1799a23a5e))
* reorganize types and handlers ([129e24a7](https://github.com/ucdjs/ucd/commit/129e24a77dea2066202722bb89f3a782bc367fd8))
* enhance mswPath generation for endpoint handling ([ed720b81](https://github.com/ucdjs/ucd/commit/ed720b816888f5288dac1d03aa2e8e17f81b87c8))
* improve type inference for responses ([ead27917](https://github.com/ucdjs/ucd/commit/ead2791726eadc5c045f06735a409fdbadd98d0b))
* refactor mock store handlers and remove unused types ([b6271135](https://github.com/ucdjs/ucd/commit/b6271135e12e6a76b0c5a822f06bbe0308597658))
* move `name` and `description` into `meta` object ([eab09e41](https://github.com/ucdjs/ucd/commit/eab09e41ce84adc0407e35ea9aa151d5bdfcd433))
* rename `setupMockStore` to `mockStoreApi` ([36bd17a2](https://github.com/ucdjs/ucd/commit/36bd17a29d2f15c3ab6c2ca0bf86e0bfee8ee7ea))
* reorganize MSW setup and mockFetch implementation ([b9be7b04](https://github.com/ucdjs/ucd/commit/b9be7b04b4a6f167680d9750fefd168584521bd6))


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
