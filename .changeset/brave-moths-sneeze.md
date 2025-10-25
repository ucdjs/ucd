---
"@ucdjs/test-utils": minor
---

Rename `mockStoreApi` to `mockStoreApi` for better clarity

The function has been renamed from `mockStoreApi` to `mockStoreApi` to better reflect that it sets up MSW HTTP route handlers for the UCD API, rather than creating a mock store object.

**Migration:**
```typescript
// Before
import { mockStoreApi } from '@ucdjs/test-utils';
mockStoreApi();

// After
import { mockStoreApi } from '@ucdjs/test-utils';
mockStoreApi();
```

The old `mockStoreApi` name is still exported as a deprecated alias for backward compatibility.
