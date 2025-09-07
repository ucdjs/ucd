---
"@ucdjs/path-utils": minor
---

Add comprehensive path utilities with security-focused path resolution

This release introduces a new path utilities package with cross-platform path handling, Windows-specific utilities, and secure path resolution functionality.

## New Functions

### Security Functions
- **`resolveSafePath(basePath, inputPath)`** - Resolves paths within secure boundaries, preventing traversal attacks
- **`decodePathSafely(encodedPath)`** - Safely decodes URL-encoded paths with infinite loop protection  
- **`isWithinBase(resolvedPath, basePath)`** - Checks if a resolved path stays within a base directory

### Platform Functions
- **`getWindowsDriveLetter(path)`** - Extracts drive letter from Windows paths
- **`getAnyUNCRoot(path)`** - Gets UNC root from network paths
- **`isWindowsDrivePath(path)`** / **`isUNCPath(path)`** - Path type detection
- **`stripDriveLetter(path)`** - Removes drive letter from paths
- **`toUnixFormat(path)`** / **`toUNCPosix(path)`** - Path format conversion

### Utility Functions
- **`isCaseSensitive`** - Detects filesystem case sensitivity
- **`osPlatform`** - Current operating system platform

## Security Features

- **Path traversal prevention** - Blocks `../` and encoded traversal attempts
- **Multi-layer encoding protection** - Handles nested URL encoding safely
- **Control character filtering** - Rejects null bytes and illegal characters
- **Cross-platform boundary enforcement** - Consistent security across OS platforms

## resolveSafePath Examples

### Basic Virtual Filesystem
```js
import { resolveSafePath } from '@ucdjs/path-utils';

// Create secure boundary
const boundary = '/home/user/app-data';

// Safe resolution within boundary
resolveSafePath(boundary, 'config.json')          // → '/home/user/app-data/config.json'
resolveSafePath(boundary, 'files/document.pdf')   // → '/home/user/app-data/files/document.pdf'
resolveSafePath(boundary, '/logs/app.log')        // → '/home/user/app-data/logs/app.log'

// Blocked traversal attempts
resolveSafePath(boundary, '../../../etc/passwd')  // ❌ PathTraversalError
resolveSafePath(boundary, '%2e%2e/secrets')       // ❌ PathTraversalError
```

### Windows Path Support
```js
// Windows drive paths
resolveSafePath('C:\\Projects\\MyApp', 'data\\users.db')     // → 'C:/Projects/MyApp/data/users.db'
resolveSafePath('C:\\Projects\\MyApp', 'D:\\external.txt')   // ❌ WindowsDriveMismatchError

// UNC network paths
resolveSafePath('\\\\server\\share', 'documents\\file.txt') // → '//server/share/documents/file.txt'
```

### Encoding Attack Protection  
```js
// Safe decoding
resolveSafePath('/base', 'file%20name.txt')       // → '/base/file name.txt'
resolveSafePath('/base', 'path%2Fto%2Ffile')      // → '/base/path/to/file'

// Attack prevention
resolveSafePath('/base', maliciouslyEncodedInput) // ❌ FailedToDecodePathError
resolveSafePath('/base', 'file\0.txt')            // ❌ IllegalCharacterInPathError
```

This package is ideal for web servers, file upload systems, containerized applications, and any scenario requiring secure path resolution within defined boundaries.
