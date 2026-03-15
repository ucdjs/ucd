# @ucdjs/utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

Curated stable utilities for UCD.js consumers.

This package exposes a small, consumer-safe facade over selected helpers used across the UCD.js ecosystem. More volatile implementation details remain in `@ucdjs-internal/shared`.

## Installation

```bash
npm install @ucdjs/utils
```

## Included utility groups

- Path filtering and tree filtering
- Glob matching helpers
- File tree helpers
- Async result helpers
- Safe API and Unicode version helpers

## Usage

### Path filtering

```ts
import { createPathFilter, PRECONFIGURED_FILTERS } from "@ucdjs/utils";

const filter = createPathFilter({
  include: ["**/*.txt"],
  exclude: [...PRECONFIGURED_FILTERS.README_FILES],
});

filter("Blocks.txt"); // true
filter("ReadMe.txt"); // false
```

### Glob helpers

```ts
import { createGlobMatcher, isValidGlobPattern } from "@ucdjs/utils";

const matcher = createGlobMatcher("auxiliary/**/*.txt");

matcher("auxiliary/GraphemeBreakProperty.txt"); // true
isValidGlobPattern("auxiliary/**/*.txt"); // true
```

### File tree helpers

```ts
import { flattenFilePaths, normalizePathForFiltering } from "@ucdjs/utils";

normalizePathForFiltering("16.0.0", "/16.0.0/ucd/Blocks.txt");
// "Blocks.txt"

flattenFilePaths([
  {
    type: "file",
    name: "Blocks.txt",
    path: "/16.0.0/ucd/Blocks.txt",
    lastModified: null,
  },
]);
// ["/16.0.0/ucd/Blocks.txt"]
```

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/utils
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
