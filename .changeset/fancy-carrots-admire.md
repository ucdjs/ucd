---
"@ucdjs/test-utils": minor
---

Reorganize package structure and improve MSW server flexibility

**Package Structure:**
- Reorganized into `mock-store/` directory with cleaner file structure
- Renamed `global-setup.ts` to `vitest-setup.ts` for clarity
- Simplified handler pattern by removing abstraction layer
- Consolidated all types into `mock-store/types.ts`

**MSW Server Improvements:**
- `setupMockStore` now accepts optional `mswServer` parameter for custom MSW servers
- Smart server resolution: automatically uses global server when `@ucdjs/test-utils/msw/vitest-setup` is imported
- Handlers now receive `mockFetch` via dependency injection for better testability
- Clear error messages when MSW server is not configured

**Usage:**
```typescript
// Option 1: Use vitest-setup (automatic server registration)
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['@ucdjs/test-utils/msw/vitest-setup']
  }
})

// Option 2: Provide your own server
setupMockStore({ mswServer: yourCustomServer });
```
