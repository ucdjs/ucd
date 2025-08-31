---
"@ucdjs/fs-bridge": minor
---

feat: add custom fs-bridge errors

Adds four new custom error classes for better error handling in the fs-bridge:

- `BridgeGenericError`: For wrapping unexpected errors with optional original error reference
- `BridgePathTraversal`: For path traversal security violations when accessing files outside allowed scope
- `BridgeFileNotFound`: For file or directory not found errors
- `BridgeEntryIsDir`: For cases where a file is expected but a directory is found

```typescript
import { BridgeFileNotFound, BridgePathTraversal } from '@ucdjs/fs-bridge';

// Example usage in bridge implementations
try {
  await fsp.readFile(path);
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new BridgeFileNotFound(path);
  }
  throw new BridgeGenericError('Unexpected file system error', error);
}
```
