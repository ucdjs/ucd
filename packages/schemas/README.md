# @ucdjs/schemas

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

Zod schemas that define the shared data contracts across the UCD.js monorepo — API responses, store manifests, lockfiles, and Unicode metadata.

## Installation

```bash
npm install @ucdjs/schemas
```

## Schema Families

All schemas are exported from the package root.

### API Schemas (`src/api.ts`)

Contracts for HTTP API responses and service configuration.

- `ApiErrorSchema` — Standard error response used by all API endpoints.
- `UCDWellKnownConfigSchema` — Shape of the `.well-known/ucd-config.json` endpoint.

### File System Schemas (`src/fs.ts`)

Shapes for file entries and the top-level store manifest.

- `FileEntrySchema` / `FileEntryListSchema` — A file or directory entry returned by the files API, with path and `lastModified`.
- `UCDStoreManifestSchema` — The store-wide manifest keyed by Unicode version.

### Lockfile & Snapshot Schemas (`src/lockfile.ts`)

State shapes used by the `ucd` CLI and the `ucd-store` app.

- `LockfileSchema` — The `ucd.lock` file, including per-version snapshot references and optional path filters.
- `SnapshotSchema` — Per-version snapshot containing file hashes and sizes.

### Version Manifest Schemas (`src/manifest.ts`)

Per-version metadata served from `/.well-known/ucd-store/{version}.json`.

- `ExpectedFileSchema` — A single expected file with name, API path, and store path.
- `UCDStoreVersionManifestSchema` — The full per-version manifest listing all expected files.

### Unicode Schemas (`src/unicode.ts`)

Shapes for Unicode version metadata and file-tree responses.

- `UnicodeVersionSchema` / `UnicodeVersionListSchema` — A Unicode version with its URL, date, type (`draft` / `stable` / `unsupported`), and optional `mappedUcdVersion`.
- `UnicodeVersionDetailsSchema` — Extends `UnicodeVersionSchema` with character, block, and script statistics.
- `UnicodeFileTreeNodeSchema` / `UnicodeFileTreeSchema` — Recursive file-tree structure for a Unicode version directory.

> [!NOTE]
> `UnicodeFileTreeNodeSchema` uses a manually unrolled recursive definition rather than `z.lazy`. Zod's `z.lazy` is not compatible with the OpenAPI/Hono tooling used to generate the API specification, so the tree depth is expressed through explicit interface types in TypeScript while keeping the Zod schema flat enough for OpenAPI generation.

## Consumer Map

| Schema family | Primary consumers |
|---|---|
| API schemas | `@ucdjs/client`, `apps/api` |
| File system schemas | `apps/store`, `@ucdjs-internal/shared` |
| Lockfile & snapshot schemas | `apps/store`, `@ucdjs/ucd-store`, `packages/pipelines/*` |
| Version manifest schemas | `apps/api`, `apps/store`, `packages/pipelines/*` |
| Unicode schemas | `@ucdjs/client`, `apps/web`, `vscode/` |

## Usage

```typescript
import { UnicodeVersionSchema, LockfileSchema } from "@ucdjs/schemas";

// Parse a Unicode version object
const version = UnicodeVersionSchema.parse(rawVersion);

// Safely parse a lockfile
const result = LockfileSchema.safeParse(rawLockfile);
if (result.success) {
  console.log(result.data.versions);
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
