# @ucdjs/schemas

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

This package provides shared schemas for UCD.js components, including file system schemas, Unicode version schemas, and tree structure schemas. These schemas are used across the UCD.js ecosystem for consistent data validation and type safety.

## Installation

```bash
npm install @ucdjs/schemas
```

## Available Schemas

### File System Schemas
- `UCDStoreManifestSchema` - Schema for UCD store manifest files
- `FileEntrySchema` - Schema for file/directory entries
- `FileEntryListSchema` - Schema for lists of file entries

### Unicode Version Schemas
- `UnicodeVersionSchema` - Schema for Unicode version metadata
- `UnicodeVersionListSchema` - Schema for lists of Unicode versions

### Tree Structure Schemas
- `UnicodeTreeNodeSchema` - Schema for tree nodes (files/directories)
- `UnicodeTreeSchema` - Schema for complete tree structures

## Usage

```typescript
import {
  FileEntrySchema,
  UnicodeVersionSchema,
  UnicodeTreeNodeSchema
} from "@ucdjs/schemas";

// Validate a file entry
const fileEntry = {
  name: "UnicodeData.txt",
  path: "/15.1.0/ucd/UnicodeData.txt",
  lastModified: Date.now(),
  type: "file"
};

const result = FileEntrySchema.safeParse(fileEntry);
if (result.success) {
  console.log("Valid file entry:", result.data);
}
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/schemas
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/schemas
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
