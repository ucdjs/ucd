# @ucdjs/fs-bridge

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

A collection of filesystem bridge implementations for the UCD project, providing both Node.js and HTTP-based file system access.

## Installation

```bash
npm install @ucdjs/fs-bridge
```

## Usage

You can create your own filesystem bridge or use the preconfigured ones provided by this package.

### Creating a Custom Bridge

You can define a custom filesystem bridge using the `defineFileSystemBridge` function. This allows you to implement your own file system operations.

```typescript
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";

const MyFileSystemBridge = defineFileSystemBridge({
  meta: {
    name: "My Custom Bridge",
    description: "A custom file system bridge"
  },
  setup() {
    return {
      // Required operations
      read: async (path) => {
        // Implement your read logic here
      },
      exists: async (path) => {
        // Implement your existence check logic here
      },
      listdir: async (path, recursive = false) => {
        // Implement your directory listing logic here
      },

      // Optional operations
      write: async (path, content) => {
        // Implement your write logic here
      },
      mkdir: async (path) => {
        // Implement your directory creation logic here
      },
      rm: async (path, options) => {
        // Implement your file/directory removal logic here
      }
    };
  }
});
```

### Async/Sync Mode Detection

The bridge automatically detects whether it should operate in **async mode** or **sync mode** based on the implementation of the required operations (`read`, `exists`, `listdir`):

- **Async Mode**: If ANY required operation is an `async` function, unsupported operations return a rejected Promise
- **Sync Mode**: If ALL required operations are synchronous, unsupported operations throw synchronously

This ensures a consistent API within each bridge type.

#### Async Bridge Example

```typescript
const asyncBridge = defineFileSystemBridge({
  meta: { name: "Async Bridge" },
  setup() {
    return {
      read: async (path) => fetchContent(path),    // Async
      exists: async (path) => checkExists(path),    // Async
      listdir: async (path) => fetchList(path),     // Async
      // write, mkdir, rm are not implemented
    };
  }
})();

// Unsupported operations return rejected Promise (can use await)
try {
  await asyncBridge.write?.("file.txt", "content");
} catch (error) {
  console.error("Write not supported:", error);
}
```

#### Sync Bridge Example

```typescript
const syncBridge = defineFileSystemBridge({
  meta: { name: "Sync Bridge" },
  setup() {
    const store = new Map();
    return {
      read: (path) => store.get(path),      // Sync
      exists: (path) => store.has(path),    // Sync
      listdir: (path) => [],                // Sync
      // write, mkdir, rm are not implemented
    };
  }
})();

// Unsupported operations throw synchronously (no async overhead)
try {
  syncBridge.write?.("file.txt", "content");
} catch (error) {
  console.error("Write not supported:", error);
}
```

**Why this matters:**
- **Async bridges** maintain a consistent async API - all operations can be awaited
- **Sync bridges** have zero async overhead - perfect for in-memory operations
- The mode is detected automatically - no configuration needed

### Predefined Bridges

#### Node.js File System Bridge

```typescript
import NodeFileSystemBridge from "@ucdjs/fs-bridge/bridges/node";

// Read a file
const content = await NodeFileSystemBridge.read("/path/to/file.txt");

// Write a file
await NodeFileSystemBridge.write("/path/to/file.txt", "Hello World");

// List directory contents
const files = await NodeFileSystemBridge.listdir("/path/to/dir");
const allFiles = await NodeFileSystemBridge.listdir("/path/to/dir", true); // recursive

// Create directory
await NodeFileSystemBridge.mkdir("/path/to/new/dir");

// Check if file exists
const exists = await NodeFileSystemBridge.exists("/path/to/file.txt");

// Get file stats
const stats = await NodeFileSystemBridge.stat("/path/to/file.txt");
console.log(stats.isFile()); // true/false
console.log(stats.isDirectory()); // true/false
console.log(stats.size); // file size in bytes
console.log(stats.mtime); // last modified date

// Remove file/directory
await NodeFileSystemBridge.rm("/path/to/file.txt");
await NodeFileSystemBridge.rm("/path/to/dir", { recursive: true, force: true });
```

#### HTTP File System Bridge

Read-only filesystem bridge for accessing files over HTTP/HTTPS:

```typescript
import HTTPFileSystemBridge from "@ucdjs/fs-bridge/bridges/http";

const httpFS = HTTPFileSystemBridge({
  baseUrl: "https://example.com/files/"
});

// Read remote file
const content = await httpFS.read("/data/file.txt");

// List remote directory
const files = await httpFS.listdir("/data/");

// Check if remote file exists
const exists = await httpFS.exists("/data/file.txt");

// Get remote file stats
const stats = await httpFS.stat("/data/file.txt");
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/fs-bridge?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/fs-bridge
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/fs-bridge?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/fs-bridge
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
