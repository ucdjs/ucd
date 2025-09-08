---
"@ucdjs/fs-bridge": minor
---

Migrate fs-bridge to use the new @ucdjs/path-utils package for improved path handling and safety.

This change removes the local path utility functions and leverages the centralized path-utils package instead:

**Before:**
```ts
import { resolveSafePath } from "./utils";
// Local BridgePathTraversal error class
```

**After:**
```ts
import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
// Uses centralized path utilities and error handling
```

**Key changes:**
- Removed local `utils.ts` file with `resolveSafePath` and `isWithinBase` functions
- Added `@ucdjs/path-utils` as a dependency
- Updated imports to use the centralized path utilities
- Removed `BridgePathTraversal` error class in favor of path-utils error handling
- Enhanced error handling to catch `PathUtilsBaseError` instances
- Added `BridgeSetupError` for better error handling during bridge setup
