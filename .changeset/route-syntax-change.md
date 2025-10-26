---
"@ucdjs/test-utils": minor
---

Changed mock store route parameter syntax from Express-style (`:param`) to OpenAPI-style (`{param}`).

**Breaking Changes:**

Route definitions now use curly braces for parameters instead of colons.

**Before:**
```ts
mockStoreApi({
  responses: {
    "/api/v1/files/:wildcard": customData
  }
});
```

**After:**
```ts
mockStoreApi({
  responses: {
    "/api/v1/files/{wildcard}": customData
  }
});
```

This aligns the mock store with OpenAPI path parameter conventions and improves consistency across the codebase.
