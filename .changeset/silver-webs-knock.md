---
"@ucdjs/fs-bridge": minor
"@ucdjs/ucd-store": minor
---

feat: add error handling wrapper to fs-bridge operations

Wraps all fs-bridge operation methods with automatic error handling to improve error management:

- **Preserves custom bridge errors**: Re-throws `BridgeBaseError` instances (like `BridgePathTraversal`, `BridgeFileNotFound`) directly
- **Wraps unexpected errors**: Converts unknown/system errors into `BridgeGenericError` with operation context
- **Transparent to implementations**: Bridge implementations don't need to change - error handling is applied automatically

```typescript
import { defineFileSystemBridge, BridgeFileNotFound, BridgeGenericError } from '@ucdjs/fs-bridge';

const bridge = defineFileSystemBridge({
  setup() {
    return {
      async read(path) {
        // If this throws a custom bridge error, it's re-thrown as-is
        if (!pathExists(path)) {
          throw new BridgeFileNotFound(path);
        }
        
        // If this throws an unexpected error (like network timeout),
        // it gets wrapped in BridgeGenericError with context
        return await fetchFile(path);
      }
    };
  }
});

// Usage - all errors are now consistently handled
try {
  await bridge.read('/some/path');
} catch (error) {
  if (error instanceof BridgeFileNotFound) {
    // Handle specific bridge error
  } else if (error instanceof BridgeGenericError) {
    // Handle wrapped unexpected error
    console.log(error.originalError); // Access the original error
  }
}
```
