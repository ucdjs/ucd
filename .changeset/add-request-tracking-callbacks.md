---
"@ucdjs/test-utils": minor
---

Added `onRequest` callback to `mockStoreApi` for request tracking.

The `onRequest` callback allows tests to track, assert, or log API requests. This is particularly useful for verifying that certain endpoints weren't called during a test, such as when testing local caching behavior.

```ts
import { mockStoreApi } from "@ucdjs/test-utils";

let apiCallCount = 0;

mockStoreApi({
  versions: ["16.0.0"],
  onRequest: ({ endpoint, method, params, url }) => {
    apiCallCount++;
    console.log(`API called: ${method} ${endpoint}`);
  }
});

// Later in test
expect(apiCallCount).toBe(0); // Verify API wasn't called
```

**Features:**

- Track API requests during tests
- Access request metadata: `endpoint`, `method`, `params`, `url`
- Verify endpoints weren't called (e.g., when using local caches)

This resolves issue #363.
