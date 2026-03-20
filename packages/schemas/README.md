# @ucdjs/schemas

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Zod schemas that define the shared data contracts across the UCD.js monorepo — API responses, store manifests, lockfiles, and Unicode metadata.

## Installation

```bash
npm install @ucdjs/schemas
```

## Usage

> [!NOTE]
> All schemas are exported from the package root.

```typescript
import { LockfileSchema, UnicodeVersionSchema } from "@ucdjs/schemas";

// Parse a Unicode version object
const version = UnicodeVersionSchema.parse(rawVersion);

// Safely parse a lockfile
const result = LockfileSchema.safeParse(rawLockfile);
if (result.success) {
  console.log(result.data.versions);
}
```

## Schema Families

For a full list of available schemas and their exports, see the [Schemas documentation](https://docs.ucdjs.dev/api-reference/schemas/schemas).

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/schemas
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/schemas
