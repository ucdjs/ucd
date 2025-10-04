# @ucdjs/test-utils

## 1.0.0

### Minor Changes

- [#295](https://github.com/ucdjs/ucd/pull/295) [`7187763`](https://github.com/ucdjs/ucd/commit/71877636a5be78f5e7a867511b78f1fc006f4eaa) Thanks [@luxass](https://github.com/luxass)! - Rename `setupMockStore` to `mockStoreApi` for better clarity

  The function has been renamed from `setupMockStore` to `mockStoreApi` to better reflect that it sets up MSW HTTP route handlers for the UCD API, rather than creating a mock store object.

  **Migration:**

  ```typescript
  // Before
  import { setupMockStore } from "@ucdjs/test-utils";
  setupMockStore();

  // After
  import { mockStoreApi } from "@ucdjs/test-utils";
  mockStoreApi();
  ```

  The old `setupMockStore` name is still exported as a deprecated alias for backward compatibility.

- [#292](https://github.com/ucdjs/ucd/pull/292) [`956277e`](https://github.com/ucdjs/ucd/commit/956277ec63983735e072f210cfd896de4e6bfe99) Thanks [@luxass](https://github.com/luxass)! - Reorganize package structure and improve MSW server flexibility

  **Package Structure:**

  - Reorganized into `mock-store/` directory with cleaner file structure
  - Renamed `global-setup.ts` to `vitest-setup.ts` for clarity
  - Simplified handler pattern by removing abstraction layer
  - Consolidated all types into `mock-store/types.ts`

  **MSW Server Improvements:**

  - `setupMockStore` now accepts optional `mswServer` parameter for custom MSW servers
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
  setupMockStore({ mswServer: yourCustomServer });
  ```

### Patch Changes

- [#291](https://github.com/ucdjs/ucd/pull/291) [`6164ec5`](https://github.com/ucdjs/ucd/commit/6164ec523993459e5edf2cce4d2f3378bb84653c) Thanks [@luxass](https://github.com/luxass)! - Align @ucdjs/test-utils with internal test utils

- Updated dependencies [[`2d3774a`](https://github.com/ucdjs/ucd/commit/2d3774afe4786e45385ba3af19f160487541a64e), [`d7b8d08`](https://github.com/ucdjs/ucd/commit/d7b8d088060b2ee473f325b1173cbb67f05ccb2f), [`8dbc72d`](https://github.com/ucdjs/ucd/commit/8dbc72d3197a0eef8e876595583c4109114cbc31), [`2222605`](https://github.com/ucdjs/ucd/commit/22226057f7587669e2ae15cd06011f38dd677741), [`b19dc76`](https://github.com/ucdjs/ucd/commit/b19dc76984e611be178de2037e5436cf3cc27dab), [`505ec62`](https://github.com/ucdjs/ucd/commit/505ec6266588299b09e1b82de0c2478514671b5c), [`82eb12e`](https://github.com/ucdjs/ucd/commit/82eb12e1d1944ebbe2748ec129a2d2b2fa315946), [`d4bdcfd`](https://github.com/ucdjs/ucd/commit/d4bdcfd5a5cd0fc3e2a6e2620a26f5e6f835af40), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`80a3794`](https://github.com/ucdjs/ucd/commit/80a3794d0469d64f0522347d6f0c3b258f4fcd35), [`d761237`](https://github.com/ucdjs/ucd/commit/d7612378002115098b7f35430aaadfed0913a3af), [`bea2c3c`](https://github.com/ucdjs/ucd/commit/bea2c3c672aee24080eef7b973c7f3c00acb1b6f), [`ec348bb`](https://github.com/ucdjs/ucd/commit/ec348bb9cea0285222347526cf5be5d14d9d61ea), [`1bac88a`](https://github.com/ucdjs/ucd/commit/1bac88add4796ef58f9b9b1d769ab03cdd4a61c0), [`69ee629`](https://github.com/ucdjs/ucd/commit/69ee629e77ad2f83a663cb7c6e8aa07fb9655a12), [`85c248b`](https://github.com/ucdjs/ucd/commit/85c248bc8f5304ee6ba56e2ded6d81ce3facd00e), [`6a43284`](https://github.com/ucdjs/ucd/commit/6a432841e12d6e5783822cc8fe2586ae2b5ab4e1), [`c013665`](https://github.com/ucdjs/ucd/commit/c013665af9188920624e516d0359293859752861), [`4052200`](https://github.com/ucdjs/ucd/commit/40522006c24f8856ff5ec34bb6630d1e1d7f68e3), [`f15bb51`](https://github.com/ucdjs/ucd/commit/f15bb51c663c05e205553c59ab0a7f06a6e20e39), [`a3f785f`](https://github.com/ucdjs/ucd/commit/a3f785f697a393dbef75728e9a8286359386c5f9), [`64e31f5`](https://github.com/ucdjs/ucd/commit/64e31f5491db5e192136eb66159108d4a98bff03), [`e52d845`](https://github.com/ucdjs/ucd/commit/e52d845b52027c625e72395a8295cbcdae5317e8), [`0ab4b32`](https://github.com/ucdjs/ucd/commit/0ab4b32b726c5ebb0c1199270dddfb7ddaae8f61), [`76b56b0`](https://github.com/ucdjs/ucd/commit/76b56b08f38f5da4dc441cdbc7fcb8d074ae5a55)]:
  - @ucdjs/ucd-store@0.1.0
  - @ucdjs/schemas@0.1.0
