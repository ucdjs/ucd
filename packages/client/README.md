# @ucdjs/client

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A TypeScript-first client for the UCD.js API with resource-based helpers for files, reports, versions, version manifests, and published server configuration.

## Installation

```bash
npm install @ucdjs/client
```

## Exports

The package exports:

- `createUCDClient(baseUrl)` for well-known discovery
- `createUCDClientWithConfig(baseUrl, config)` for explicit endpoint configuration
- `discoverEndpointsFromConfig(baseUrl)` if you want to fetch the well-known config yourself
- `getDefaultUCDEndpointConfig()` for the library's built-in fallback config

## Usage

### Automatic discovery with `createUCDClient`

`createUCDClient()` fetches `/.well-known/ucd-config.json` from the provided origin, validates it, and then creates resource wrappers from the discovered endpoint paths.
This function is async and will throw if discovery fails or the well-known config is invalid.

```typescript
import { createUCDClient } from "@ucdjs/client";

const client = await createUCDClient("https://api.ucdjs.dev");

const { data: versions, error } = await client.versions.list();

if (error) {
  console.error("Failed to fetch versions:", error.message);
} else {
  console.log("Available versions:", versions);
}
```

### Explicit configuration with `createUCDClientWithConfig`

`createUCDClientWithConfig()` skips the discovery request. You pass the same `UCDWellKnownConfig` shape that the well-known endpoint would return.

This is useful when:

- you already have the config available at build time
- you want to avoid an extra startup request
- your API is hosted on a different path, but still serves the same response types

```typescript
import { createUCDClientWithConfig } from "@ucdjs/client";

const client = createUCDClientWithConfig("https://example.com", {
  version: "0.1",
  endpoints: {
    files: "/custom/api/files",
    manifest: "/custom/api/versions/{version}/manifest",
    reports: "/custom/api/reports",
    versions: "/custom/api/versions",
  },
});

const { data: fileTree, error } = await client.versions.getFileTree("16.0.0");

if (error) {
  console.error("Failed to fetch file tree:", error.message);
} else {
  console.log("File tree:", fileTree);
}
```

## Well-known discovery vs. explicit config

The client supports two ways to arrive at the same endpoint shape:

- `createUCDClient(baseUrl)` reads `https://<origin>/.well-known/ucd-config.json`
- `createUCDClientWithConfig(baseUrl, config)` accepts that config object directly

In other words, the difference is the source of truth:

- well-known discovery loads the config from the server at runtime
- explicit config provides the same data in code

This makes it possible to host the API under a different path without changing the client-facing types. For example, a deployment may expose:

- `/.well-known/ucd-config.json` on the main origin
- `/edge/api/files` for files
- `/edge/api/versions` for version endpoints

As long as the config points to those paths, the same `client.files.*` and `client.versions.*` methods continue to work.

Regardless of whether you created the client with `createUCDClient()` or `createUCDClientWithConfig()`, `client.config.get()` always reads the published well-known config from the origin:

- `/.well-known/ucd-config.json`

Version manifest requests follow the configured `endpoints.manifest` value. By default that points to the canonical API route:

- `/api/v1/versions/{version}/manifest`

## Resources

The returned client exposes resource helpers:

- `client.files.get(path, query?)` to fetch a Unicode file or directory listing
- `client.files.head(path, query?)` to read file or directory metadata without downloading the body
- `client.versions.list()` to list available Unicode versions
- `client.versions.get(version)` to fetch metadata and statistics for a specific Unicode version
- `client.versions.getFileTree(version)` to fetch a version's file tree
- `client.versions.getManifest(version)` to read the canonical per-version manifest
- `client.reports.list()` to list Unicode reports and adjacent revisions
- `client.reports.get(reportId)` to read the latest revision metadata for a report
- `client.reports.getRevision(reportId, revId)` to read metadata for a specific revision
- `client.reports.getHtml(reportId, revId)` to fetch the HTML document for a revision
- `client.config.get()` to read `/.well-known/ucd-config.json`

### Fetch a file

```typescript
const { data: fileContent, error } = await client.files.get("16.0.0/ucd/UnicodeData.txt");

if (error) {
  console.error("Failed to fetch file:", error.message);
} else {
  console.log("File content:", fileContent);
}
```

### Filter a directory listing

`client.files.get()` and `client.files.head()` both accept the typed file query parameters generated from OpenAPI:

- `query` for prefix matching
- `pattern` for glob filtering
- `sort` for `name` or `lastModified`
- `order` for `asc` or `desc`
- `type` for `all`, `files`, or `directories`

```typescript
const { data: files, error } = await client.files.get("16.0.0/ucd", {
  query: "Uni",
  pattern: "*.txt",
  sort: "lastModified",
  order: "desc",
  type: "files",
});

if (error) {
  console.error("Failed to fetch filtered directory listing:", error.message);
} else {
  console.log("Filtered files:", files);
}
```

### Read file metadata with `HEAD`

```typescript
const { data, error, response } = await client.files.head("16.0.0/ucd/UnicodeData.txt");

if (error) {
  console.error("Failed to read file metadata:", error.message);
} else {
  console.log("No response body:", data); // null
  console.log("Content-Type:", response?.headers.get("Content-Type"));
  console.log("Content-Length:", response?.headers.get("Content-Length"));
}
```

### Read version details

```typescript
const { data: version, error } = await client.versions.get("16.0.0");

if (error) {
  console.error("Failed to fetch version details:", error.message);
} else {
  console.log("Version type:", version.type);
  console.log("Statistics:", version.statistics);
}
```

### Read the published config

```typescript
const { data: config, error } = await client.config.get();

if (error) {
  console.error("Failed to fetch config:", error.message);
} else {
  console.log("Published config:", config);
}
```

### Read a version manifest

```typescript
const { data: manifest, error } = await client.versions.getManifest("16.0.0");

if (error) {
  console.error("Failed to fetch manifest:", error.message);
} else {
  console.log("Expected files:", manifest.expectedFiles);
}
```

> [!NOTE]
> Full documentation is available at [docs.ucdjs.dev/api-reference/client](https://docs.ucdjs.dev/api-reference/client).

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/client?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/client
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/client?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/client
