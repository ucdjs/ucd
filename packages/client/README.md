# @ucdjs/client

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

A TypeScript-first client for the UCD.js API with resource-based helpers for files, versions, manifests, and published server configuration.

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
    manifest: "/.well-known/ucd-store/{version}.json",
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

## Config vs. well-known discovery

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

The `client.config.get()` and `client.manifest.get(version)` helpers still read the published well-known documents from the origin:

- `/.well-known/ucd-config.json`
- `/.well-known/ucd-store/<version>.json`

## Resources

The returned client exposes four resource namespaces:

- `client.files.get(path)` to fetch a Unicode file or directory listing
- `client.versions.list()` to list available Unicode versions
- `client.versions.getFileTree(version)` to fetch a version's file tree
- `client.config.get()` to read `/.well-known/ucd-config.json`
- `client.manifest.get(version)` to read `/.well-known/ucd-store/<version>.json`

### Fetch a file

```typescript
const { data: fileContent, error } = await client.files.get("16.0.0/ucd/UnicodeData.txt");

if (error) {
  console.error("Failed to fetch file:", error.message);
} else {
  console.log("File content:", fileContent);
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
const { data: manifest, error } = await client.manifest.get("16.0.0");

if (error) {
  console.error("Failed to fetch manifest:", error.message);
} else {
  console.log("Expected files:", manifest.files);
}
```

## Documentation

For more examples and API reference, visit the [Client Documentation](https://docs.ucdjs.dev/api-reference/client).

## License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/client?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/client
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/client?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/client
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
