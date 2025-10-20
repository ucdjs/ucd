---
"@ucdjs/fs-bridge": minor
---

Refactored file system bridge metadata structure to simplify the API and improve consistency.

**Breaking Changes:**

- Moved `name` and `description` from top-level properties into the `metadata` object
- The `metadata` property is now required instead of optional
- Removed `persistent` and `mirror` properties from metadata
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
  metadata: {
    name: "My Bridge",
    description: "A file system bridge",
  },
  setup: () => ({ /* operations */ })
});
```

This change consolidates all descriptive information into the metadata object, making the bridge definition cleaner and more predictable.
