---
"@ucdjs/fs-bridge": minor
---

Add universal hooks system for file system bridge operations

File system bridges now support hooks for observing and intercepting operations:

**Hook Types:**
- `error` - Called when any operation throws an error (including unsupported operations)
- `{operation}:before` - Called before an operation executes (e.g., `read:before`, `write:before`)
- `{operation}:after` - Called after an operation succeeds (e.g., `read:after`, `write:after`)

**Supported Operations:**
- `read`, `write`, `listdir`, `exists`, `mkdir`, `rm`

**Usage Example:**
```typescript
import { createNodeBridge } from '@ucdjs/fs-bridge';

const bridge = createNodeBridge({ basePath: './data' });

// Register hooks
bridge.on('read:before', ({ path }) => {
  console.log(`Reading: ${path}`);
});

bridge.on('read:after', ({ path, content }) => {
  console.log(`Read ${content.length} bytes from ${path}`);
});

bridge.on('error', ({ method, path, error }) => {
  console.error(`${method} failed on ${path}:`, error);
});
```

**Exported Types:**
- `FileSystemBridgeHooks` - Main hooks interface

This enables use cases like logging, metrics, caching, testing, and auditing across all bridge implementations (Node, HTTP, Memory).
