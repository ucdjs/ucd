---
"@ucdjs/fs-bridge": minor
---

Renamed `on` method to `hook` for event handling in FileSystemBridge.

**Breaking Change:**

The event handling method has been renamed from `on` to `hook` for improved clarity and consistency with the underlying `hookable` library.

**Before:**

```ts
import { createFileSystemBridge } from "@ucdjs/fs-bridge";

const bridge = createFileSystemBridge(/* ... */);

bridge.on("read:before", ({ path }) => {
  console.log(`Reading file: ${path}`);
});

bridge.on("error", ({ method, path, error }) => {
  console.error(`Error in ${method} at ${path}:`, error);
});
```

**After:**

```ts
import { createFileSystemBridge } from "@ucdjs/fs-bridge";

const bridge = createFileSystemBridge(/* ... */);

bridge.hook("read:before", ({ path }) => {
  console.log(`Reading file: ${path}`);
});

bridge.hook("error", ({ method, path, error }) => {
  console.error(`Error in ${method} at ${path}:`, error);
});
```

**Migration:**

Simply replace all instances of `.on(` with `.hook(` when working with FileSystemBridge instances. The hook signatures and payloads remain unchanged.