# @ucdjs-internal/shared

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

> [!IMPORTANT]
> This is an internal package. It may change without warning and is not subject to semantic versioning. Use at your own risk.

A collection of utility functions and filesystem bridge implementations for the UCD project.

## Installation

```bash
npm install @ucdjs-internal/shared
```

## Usage

### Path Filtering

Creates a filter function that checks if a file path should be included or excluded based on glob patterns.

```typescript
import { createPathFilter } from "@ucdjs-internal/shared";

const filter = createPathFilter(["*.txt", "!*Test*"]);
filter("Data.txt"); // true
filter("DataTest.txt"); // false
```

#### PathFilter Methods

The `PathFilter` object provides additional methods:

```typescript
const filter = createPathFilter(["*.js"]);

// Extend with additional patterns
filter.extend(["*.ts", "!*.test.*"]);

// Get current patterns
const patterns = filter.patterns(); // ['*.js', '*.ts', '!*.test.*']

// Use with extra filters temporarily
filter("app.js", ["!src/**"]); // Apply extra exclusions
```

### Preconfigured Filters

Pre-defined filter patterns for common exclusions:

```typescript
import { createPathFilter, PRECONFIGURED_FILTERS } from "@ucdjs-internal/shared";

const filter = createPathFilter([
  "*.txt",
  PRECONFIGURED_FILTERS.EXCLUDE_TEST_FILES,
  PRECONFIGURED_FILTERS.EXCLUDE_README_FILES,
  PRECONFIGURED_FILTERS.EXCLUDE_HTML_FILES
]);
```

Available filters:
- `EXCLUDE_TEST_FILES`: Excludes files containing "Test" in their name
- `EXCLUDE_README_FILES`: Excludes ReadMe.txt files
- `EXCLUDE_HTML_FILES`: Excludes all HTML files

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs-internal/shared?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs-internal/shared
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs-internal/shared?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs-internal/shared
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
