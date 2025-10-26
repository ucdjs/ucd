---
"@ucdjs/test-utils": minor
---

Added `customResponses` option to `mockStoreApi` for registering custom endpoint handlers.

You can now add custom endpoints beyond the predefined API routes:

```ts
import { mockStoreApi } from "@ucdjs/test-utils";
import { HttpResponse } from "msw";

mockStoreApi({
  customResponses: [
    ["GET", "https://api.ucdjs.dev/api/v1/stats", () => {
      return HttpResponse.json({ totalVersions: 42 });
    }],
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
    [["POST", "PUT"], "https://api.ucdjs.dev/api/v1/cache", ({ request }) => {
      return HttpResponse.json({ method: request.method });
    }],
  ],
});

// Path parameters
mockStoreApi({
  customResponses: [
    ["GET", "https://api.ucdjs.dev/api/v1/versions/:version/stats", ({ params }) => {
      return HttpResponse.json({ version: params.version, downloads: 100 });
    }],
  ],
});

// Combine with regular responses
mockStoreApi({
  responses: {
    "/api/v1/versions": [],
  },
  customResponses: [
    ["GET", "https://api.ucdjs.dev/api/v1/search", () => {
      return HttpResponse.json({ results: [] });
    }],
  ],
});
```

This is useful for testing custom endpoints or extending the mock API with additional functionality.