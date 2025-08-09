# @ucdjs/test-utils-internal

This package provides internal test utils used across the repository.

## Usage

### MSW

This package provides utilities for working with [MSW (Mock Service Worker)](https://mswjs.io/).

> [!NOTE]
> By default, MSW is enabled for all tests, except for those in marked with worker.

```typescript
import { HttpResponse, mockFetch } from "@ucdjs/test-utils-internal/msw";

mockFetch([
  // register the handler for a single method.
  ["GET", "https://api.ucdjs.dev/api/v1/versions", () => {
    return new HttpResponse(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }],
  // register same handler for multiple methods
  [["GET", "POST"], "https://api.ucdjs.dev/api/v2/versions", () => {
    return new HttpResponse(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }]
]);
```

> [!IMPORTANT]
> When using `mockFetch` inside a describe block to share mocks across multiple tests, wrap it in a `beforeEach` block to ensure proper setup for each test.

## 📄 License

Published under [MIT License](./LICENSE).
