---
"@ucdjs/fs-bridge": minor
---

feat: add path traversal utilities to bridge setup context

Adds shared utility functions to the bridge setup context for consistent path security:

- **`resolveSafePath(basePath, inputPath)`**: Safely resolves paths while preventing traversal attacks
- **`isWithinBase(resolvedPath, basePath)`**: Checks if a path is within an allowed base directory

Both utilities work for file system paths (Node bridge) and URL paths (HTTP bridge) by treating URL pathnames as base paths.

```typescript
import { defineFileSystemBridge } from '@ucdjs/fs-bridge';

const bridge = defineFileSystemBridge({
  optionsSchema: z.object({ basePath: z.string() }),
  setup({ options, resolveSafePath }) {
    const basePath = resolve(options.basePath);
    
    return {
      async read(path) {
        // Automatically prevents path traversal - throws BridgePathTraversal if unsafe
        const safePath = resolveSafePath(basePath, path);
        return readFile(safePath);
      }
    };
  }
});

// For HTTP bridges, URL pathname is used as base path:
const httpBridge = defineFileSystemBridge({
  setup({ options, resolveSafePath }) {
    const baseUrl = new URL(options.baseUrl);
    const basePath = baseUrl.pathname; // e.g., "/api/v1/files"
    
    return {
      async read(path) {
        // Prevents escaping API endpoint: "../admin" → BridgePathTraversal
        const safePath = resolveSafePath(basePath, path);
        const url = new URL(safePath, baseUrl.origin);
        return fetch(url).then(r => r.text());
      }
    };
  }
});
```
