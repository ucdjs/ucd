---
"@ucdjs/fs-bridge": minor
---

Refactored file system bridge metadata structure to simplify the API and improve consistency.

**Breaking Changes:**

- Renamed `metadata` property to `meta`
- Moved `name` and `description` from top-level properties into the `meta` object
- The `meta` property is now required instead of optional
- Removed `persistent` and `mirror` properties from old `metadata` object
- Removed support for custom metadata fields

**Before:**

```ts
const MyBridge = defineFileSystemBridge({
  name: "My Bridge",
  description: "A file system bridge",
  metadata: {
    persistent: true,
  },
  setup: () => ({ /* operations */ })
});
```

**After:**

```ts
const MyBridge = defineFileSystemBridge({
  meta: {
    name: "My Bridge",
    description: "A file system bridge",
  },
  setup: () => ({ /* operations */ })
});
```

This change consolidates all descriptive information into the `meta` object, making the bridge definition cleaner and more predictable.
