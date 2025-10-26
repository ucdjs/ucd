---
"@ucdjs/test-utils": minor
---

Added `configure` helper for customizing mock responses with latency and headers.

The new `configure` helper allows you to simulate network latency and add custom headers to mock responses:

```ts
import { mockStoreApi, configure } from "@ucdjs/test-utils";

mockStoreApi({
  responses: {
    "/api/v1/versions": configure({
      response: [{ version: "16.0.0", /* ... */ }],
      latency: 100, // 100ms delay
      headers: { "X-Custom-Header": "value" }
    })
  }
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
  latency: "random" // Random 100-999ms
});

// Test rate limiting headers
configure({
  response: data,
  headers: {
    "X-Rate-Limit-Remaining": "10",
    "X-Rate-Limit-Reset": "1234567890"
  }
});

// Combine latency and headers
configure({
  response: data,
  latency: 200,
  headers: { "X-Request-ID": "test-123" }
});
```