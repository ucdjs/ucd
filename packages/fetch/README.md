# @ucdjs/fetch

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![codecov][codecov-src]][codecov-href]

A TypeScript-first HTTP client for interacting with the UCD.js API, providing type-safe methods for fetching Unicode character data.

## Installation

```bash
npm install @ucdjs/fetch
```

## Usage

### Basic Usage

```typescript
import { client } from "@ucdjs/fetch";

// Get Unicode versions
const { data: versions, error } = await client.GET("/api/v1/unicode-versions");
if (error) {
  console.error("Error:", error.message);
} else {
  console.log("Available versions:", versions);
}

// Access Unicode data files via proxy
const { data: fileInfo } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
  params: {
    path: { wildcard: "latest/ucd.all.json" }
  }
});
console.log("File info:", fileInfo);
```

### Custom Client Configuration

```typescript
import { createClient } from "@ucdjs/fetch";

// Create client with custom UCD.js API instance
const customClient = createClient("https://preview.api.ucdjs.dev");

// Use the custom client
const { data, error } = await customClient.GET("/api/v1/unicode-versions");
if (data) {
  console.log("Unicode versions from preview API:", data);
}
```

### Working with Binary Data

```typescript
import { client } from "@ucdjs/fetch";

// Fetch binary Unicode data file
const { data: binaryData } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
  params: {
    path: { wildcard: "latest/UnicodeData.txt" }
  },
  parseAs: "arrayBuffer"
});

if (binaryData) {
  // eslint-disable-next-line node/prefer-global/buffer
  const text = Buffer.from(binaryData).toString("utf-8");
  console.log("Unicode data:", `${text.substring(0, 100)}...`);
}
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/fetch?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/fetch
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/fetch?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/fetch
[codecov-src]: https://img.shields.io/codecov/c/gh/ucdjs/ucd?style=flat&colorA=18181B&colorB=4169E1
[codecov-href]: https://codecov.io/gh/ucdjs/ucd
