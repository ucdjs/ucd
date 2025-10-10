---
"@ucdjs/test-utils": minor
---

Add `createTestStore` helper function for simplified test setup

Added a new `createTestStore` helper function that simplifies common store creation patterns in tests. It combines testdir setup, store creation, and optional API mocking into a single function.

**Features:**
- Auto-creates testdir with custom file structure
- Supports any filesystem bridge (Node, HTTP, custom)
- Optional built-in API mocking via `mockApi` parameter
- Auto-initialization (configurable via `autoInit`)
- Returns both store and storePath for easy assertions

**Usage Examples:**

```typescript
import { createTestStore } from '@ucdjs/test-utils';

// Simple Node store with testdir
const { store, storePath } = await createTestStore({
  structure: { "15.0.0": { "file.txt": "content" } },
  versions: ["15.0.0"]
});

// With API mocking
const { store } = await createTestStore({
  structure: { "15.0.0": { "file.txt": "content" } },
  mockApi: true // uses default mockStoreApi configuration
});

// Custom API responses
const { store } = await createTestStore({
  structure: { "15.0.0": { "file.txt": "content" } },
  mockApi: {
    responses: {
      "/api/v1/versions": customVersions,
    }
  }
});

// Custom filesystem bridge (HTTP)
const { store } = await createTestStore({
  fs: HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" }),
  versions: ["15.0.0"]
});

// Manual initialization control
const { store } = await createTestStore({
  structure: { "15.0.0": { "file.txt": "content" } },
  autoInit: false // don't auto-initialize
});
await store.init(); // initialize manually
```

This helper is fully optional and works alongside the existing `mockStoreApi` function for maximum flexibility.
