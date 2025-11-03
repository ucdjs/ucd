---
"@ucdjs/fs-bridge": minor
---

Added automatic async/sync mode detection for file system bridges.

The bridge now automatically detects whether it should operate in async or sync mode by inspecting the required operations (`read`, `exists`, `listdir`). This detection affects how unsupported operations behave and eliminates async overhead for pure synchronous bridges.

**New Feature: `bridge.meta.isAsyncMode`**

You can now access the detected mode via the `isAsyncMode` property on the bridge metadata:

```ts
const syncBridge = defineFileSystemBridge({
  meta: { name: "Sync Bridge" },
  setup() {
    return {
      read: (path) => content,      // Sync
      exists: (path) => true,        // Sync
      listdir: (path) => [],         // Sync
    };
  }
})();

console.log(syncBridge.meta.isAsyncMode); // false
```

**How Mode Detection Works:**

- **Async Mode**: If ANY required operation is an `async` function, the bridge operates in async mode
- **Sync Mode**: If ALL required operations are synchronous, the bridge operates in sync mode

**Impact on Unsupported Operations:**

- **Async bridges**: Unsupported operations return a rejected Promise (can use `await`)
- **Sync bridges**: Unsupported operations throw synchronously (zero async overhead)

**Examples:**

```ts
// Sync Bridge - throws synchronously
const syncBridge = defineFileSystemBridge({
  setup() {
    return {
      read: (path) => store.get(path),
      exists: (path) => store.has(path),
      listdir: (path) => [],
    };
  }
})();

try {
  syncBridge.write?.("file.txt", "content");
} catch (error) {
  // Catches synchronous throw
}

// Async Bridge - returns rejected Promise
const asyncBridge = defineFileSystemBridge({
  setup() {
    return {
      read: async (path) => fetchContent(path),
      exists: async (path) => checkExists(path),
      listdir: async (path) => fetchList(path),
    };
  }
})();

try {
  await asyncBridge.write?.("file.txt", "content");
} catch (error) {
  // Catches async rejection
}
```

**Benefits:**

- **Zero async overhead for sync bridges**: Pure synchronous operations like in-memory stores have no Promise wrapping
- **Consistent async API**: Async bridges are fully awaitable, including errors
- **Automatic detection**: No configuration needed, works based on implementation