# @ucdjs/test-utils

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
