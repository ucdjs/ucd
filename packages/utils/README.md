# @ucdjs/utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

A collection of utility functions and filesystem bridge implementations for the UCD project.

## Installation

```bash
npm install @ucdjs/utils
```

## Usage

### Path Filtering

Creates a filter function that checks if a file path should be included or excluded based on glob patterns.

```typescript
import { createPathFilter } from '@ucdjs/utils';

const filter = createPathFilter(['*.txt', '!*Test*']);
filter('Data.txt'); // true
filter('DataTest.txt'); // false
```

#### PathFilter Methods

The `PathFilter` object provides additional methods:

```typescript
const filter = createPathFilter(['*.js']);

// Extend with additional patterns
filter.extend(['*.ts', '!*.test.*']);

// Get current patterns
const patterns = filter.patterns(); // ['*.js', '*.ts', '!*.test.*']

// Use with extra filters temporarily
filter('app.js', ['!src/**']); // Apply extra exclusions
```

### Preconfigured Filters

Pre-defined filter patterns for common exclusions:

```typescript
import { createPathFilter, PRECONFIGURED_FILTERS } from '@ucdjs/utils';

const filter = createPathFilter([
  '*.txt',
  PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES,
  PRECONFIGURED_FILTERS.EXCLUDE_README_FILES,
  PRECONFIGURED_FILTERS.EXCLUDE_HTML_FILES
]);
```

Available filters:
- `EXCLUDE_TEST_FILES`: Excludes files containing "Test" in their name
- `EXCLUDE_README_FILES`: Excludes ReadMe.txt files
- `EXCLUDE_HTML_FILES`: Excludes all HTML files

### File System Bridge

The filesystem bridge provides a unified interface for file operations across different environments.

#### Node.js File System Bridge

```typescript
import NodeFileSystemBridge from '@ucdjs/utils/fs-bridge/node';

// Read a file
const content = await NodeFileSystemBridge.read('/path/to/file.txt');

// Write a file
await NodeFileSystemBridge.write('/path/to/file.txt', 'Hello World');

// List directory contents
const files = await NodeFileSystemBridge.listdir('/path/to/dir');
const allFiles = await NodeFileSystemBridge.listdir('/path/to/dir', true); // recursive

// Create directory
await NodeFileSystemBridge.mkdir('/path/to/new/dir');

// Check if file exists
const exists = await NodeFileSystemBridge.exists('/path/to/file.txt');

// Get file stats
const stats = await NodeFileSystemBridge.stat('/path/to/file.txt');
console.log(stats.isFile()); // true/false
console.log(stats.isDirectory()); // true/false
console.log(stats.size); // file size in bytes
console.log(stats.mtime); // last modified date

// Remove file/directory
await NodeFileSystemBridge.rm('/path/to/file.txt');
await NodeFileSystemBridge.rm('/path/to/dir', { recursive: true, force: true });
```

#### HTTP File System Bridge

Read-only filesystem bridge for accessing files over HTTP/HTTPS:

```typescript
import HTTPFileSystemBridge from '@ucdjs/utils/fs-bridge/http';

const httpFS = HTTPFileSystemBridge({
  baseUrl: 'https://example.com/files/'
});

// Read remote file
const content = await httpFS.read('/data/file.txt');

// List remote directory
const files = await httpFS.listdir('/data/');

// Check if remote file exists
const exists = await httpFS.exists('/data/file.txt');

// Get remote file stats
const stats = await httpFS.stat('/data/file.txt');
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/utils
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
