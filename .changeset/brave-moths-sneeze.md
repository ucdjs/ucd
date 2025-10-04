---
"@ucdjs/test-utils": minor
---

Rename `setupMockStore` to `mockStoreApi` for better clarity

The function has been renamed from `setupMockStore` to `mockStoreApi` to better reflect that it sets up MSW HTTP route handlers for the UCD API, rather than creating a mock store object.

**Migration:**
```typescript
// Before
import { setupMockStore } from '@ucdjs/test-utils';
setupMockStore();

// After
import { mockStoreApi } from '@ucdjs/test-utils';
mockStoreApi();
```

The old `setupMockStore` name is still exported as a deprecated alias for backward compatibility.
