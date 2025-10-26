---
"@ucdjs/test-utils": minor
---

Added support for error responses in mock store using `ApiError` type from `@ucdjs/schemas`.

You can now return API error responses to test error handling scenarios:

```ts
import { mockStoreApi } from "@ucdjs/test-utils";
import type { ApiError } from "@ucdjs/schemas";

const errorResponse: ApiError = {
  message: "Version not found",
  status: 404,
  timestamp: new Date().toISOString()
};

mockStoreApi({
  responses: {
    "/api/v1/versions": errorResponse
  }
});
```

This makes it easier to test error handling while maintaining full type safety with the standardized API error format.