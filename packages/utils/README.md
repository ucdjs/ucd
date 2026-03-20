# @ucdjs/utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Curated stable utilities for UCD.js consumers.

This package exposes a small, consumer-safe facade over selected helpers used across the UCD.js ecosystem. More volatile implementation details remain in `@ucdjs-internal/shared`.

## Installation

```bash
npm install @ucdjs/utils
```

## Included utility groups

- Unicode version helpers
- API error guards

## Usage

### Unicode version helpers

```ts
import {
  getLatestStableUnicodeVersion,
  isStableUnicodeVersion,
  isValidUnicodeVersion,
} from "@ucdjs/utils";

isValidUnicodeVersion("16.0.0"); // true
isStableUnicodeVersion("16.0.0"); // true
getLatestStableUnicodeVersion(); // e.g. "16.0.0"
```

### API error guard

```ts
import { isApiError } from "@ucdjs/utils";

const result: unknown = await fetch("/api").then((r) => r.json());

if (isApiError(result)) {
  console.error(result.message);
}
```

## Relationship

```text
consumer code
  -> @ucdjs/utils
    -> curated public helpers

internal workspace code
  -> @ucdjs-internal/shared
    -> volatile/internal helper families
```

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/utils?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/utils
