# @ucdjs-internal/shared

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

> [!IMPORTANT]
> This is an internal package. It may change without warning and is not subject to semantic versioning. Use at your own risk.

Volatility-marked shared helpers used across the UCD.js workspace.

> [!WARNING]
> This package is published so workspace consumers can depend on it directly, but the `internal` name is intentional: breaking changes can ship in patch releases.
>
> Small external-consumer helpers such as Unicode version helpers and API guards are exposed through `@ucdjs/utils`. This package remains the volatile implementation layer.

## Installation

```bash
npm install @ucdjs-internal/shared
```

## What lives here

- Async helpers and result wrappers
- Internal fetch utilities
- File tree helpers
- Path filtering and glob helpers
- API guards and Unicode version helpers

## Package boundary

> [!IMPORTANT]
> Use `@ucdjs/utils` for stable consumer-facing helpers.
> Use `@ucdjs/env` for config-path utilities (`getUcdConfigDir`, `getUcdConfigPath`).
>
> Keep infrastructure-heavy helpers here for now, especially `customFetch` and `createDebugger`.
>
> Do not treat this package as a broad public API contract.

## Relationship

```text
consumer code
  -> @ucdjs/utils
    -> small public helpers

internal workspace code
  -> @ucdjs-internal/shared
    -> volatile/internal helper families
```

## Usage

### Path Filtering

```typescript
import { createPathFilter } from "@ucdjs-internal/shared";

const filter = createPathFilter({
  include: ["**/*.txt"],
  exclude: ["**/ReadMe.txt"],
});

filter("Blocks.txt"); // true
filter("ReadMe.txt"); // false
```

### Preconfigured Filters

```typescript
import { createPathFilter, PRECONFIGURED_FILTERS } from "@ucdjs-internal/shared";

const filter = createPathFilter({
  include: ["**/*.txt"],
  exclude: [
    ...PRECONFIGURED_FILTERS.TEST_FILES,
    ...PRECONFIGURED_FILTERS.README_FILES,
  ],
});
```

### Internal fetch helper

```typescript
import { customFetch } from "@ucdjs-internal/shared";

const response = await customFetch("https://api.ucdjs.dev/.well-known/ucd-config.json");
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs-internal/shared?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs-internal/shared
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs-internal/shared?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs-internal/shared
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
