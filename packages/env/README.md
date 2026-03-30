# @ucdjs/env

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Runtime constants and environment helpers shared across the UCD.js workspace.

## Installation

```bash
npm install @ucdjs/env
```

> [!NOTE]
> Full documentation is available at [docs.ucdjs.dev/api-reference/utilities/env](https://docs.ucdjs.dev/api-reference/utilities/env).

## Exports

### Base URL Constants

These resolve from the matching `process.env` variable when set, otherwise fall back to the defaults below.

| Export                 | Default                         |
| ---------------------- | ------------------------------- |
| `UCDJS_API_BASE_URL`   | `https://api.ucdjs.dev`         |
| `UCDJS_DOCS_URL`       | `https://docs.ucdjs.dev`        |
| `UCDJS_STORE_BASE_URL` | `https://ucd-store.ucdjs.dev`   |
| `DEFAULT_USER_AGENT`   | `ucdjs.dev (https://ucdjs.dev)` |

### HTTP Stat Headers

Header name constants used in UCD HTTP responses to surface file/directory metadata.

| Export                           | Header name                 |
| -------------------------------- | --------------------------- |
| `UCD_STAT_TYPE_HEADER`           | `X-UCD-Stat-Type`           |
| `UCD_STAT_SIZE_HEADER`           | `X-UCD-Stat-Size`           |
| `UCD_STAT_CHILDREN_HEADER`       | `X-UCD-Stat-Children`       |
| `UCD_STAT_CHILDREN_FILES_HEADER` | `X-UCD-Stat-Children-Files` |
| `UCD_STAT_CHILDREN_DIRS_HEADER`  | `X-UCD-Stat-Children-Dirs`  |

### Utilities

#### `requiredEnv(env, requiredKeys)`

Validates that the specified keys are present in an environment object and returns it with narrowed types. Throws if any key is missing.

```ts
import { requiredEnv } from "@ucdjs/env";

const env = requiredEnv(rawEnv, ["DATABASE_URL", "API_KEY"]);
// env.DATABASE_URL and env.API_KEY are guaranteed non-nullable
```

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/env?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/env
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/env?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/env
