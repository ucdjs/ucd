---
"@ucdjs/test-utils": minor
---

Added `unsafeResponse` helper for testing with invalid or non-schema-compliant responses.

The new `unsafeResponse` helper bypasses TypeScript type checking to test error handling with invalid data:

```ts
import { mockStoreApi, unsafeResponse } from "@ucdjs/test-utils";

// Test error handling with malformed response
mockStoreApi({
  responses: {
    "/api/v1/versions": unsafeResponse({ invalid: "data" })
  }
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
      headers: { "X-Test-Case": "invalid-response" }
    })
  }
});
```

This is useful for testing how your application handles unexpected API behavior.