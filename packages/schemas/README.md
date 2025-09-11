# @ucdjs/schemas

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

This package provides shared schemas for the UCD.js ecosystem, including validation schemas for file system operations, store manifests, and other common data structures.

## Installation

```bash
npm install @ucdjs/schemas
```

## Usage

### File System Schemas

```typescript
import { FileEntrySchema, FileEntry, FileEntryList } from "@ucdjs/schemas";

// Validate a file entry
const fileEntry = {
  name: "UnicodeData.txt",
  path: "/15.1.0/UnicodeData.txt",
  lastModified: Date.now(),
  type: "file" as const
};

const result = FileEntrySchema.safeParse(fileEntry);
if (result.success) {
  console.log("Valid file entry:", result.data);
}

// Work with file lists
const fileList: FileEntryList = [fileEntry];
```

### Store Manifest Schemas

```typescript
import { UCDStoreManifestSchema, UCDStoreManifest } from "@ucdjs/schemas";

// Validate a UCD store manifest
const manifest = {
  "15.1.0": "15.1.0",
  "15.0.0": "15.0.0",
  "14.0.0": "14.0.0"
};

const result = UCDStoreManifestSchema.safeParse(manifest);
if (result.success) {
  console.log("Valid manifest:", result.data);
}
```

## Relationship with @ucdjs/fetch

This package contains shared schemas that are used across the UCD.js ecosystem. The `@ucdjs/fetch` package re-exports all schemas from this package for convenience, so you can import them from either package:

```typescript
// Option 1: Direct import from schemas (recommended for schema validation only)
import { FileEntrySchema } from "@ucdjs/schemas";

// Option 2: Import from fetch package (convenient when also using the API client)
import { FileEntrySchema, client } from "@ucdjs/fetch";
```

## Available Schemas

- **FileEntry**: Schema for file/directory entries in the UCD store
- **FileEntryList**: Array of file entries
- **UCDStoreManifest**: Schema for UCD store version manifests

All schemas are built using [Zod](https://zod.dev/) for runtime validation and TypeScript type inference.

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/schemas
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/schemas?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/schemas
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
