# @ucdjs/pipeline-server

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A pipeline development server for the UCD project. Provides a web UI and HTTP API for discovering, inspecting, and executing pipelines from local or remote sources.

## Installation

```bash
npm install @ucdjs/pipeline-server
```

## Usage

### Start the server

```ts
import { startServer } from "@ucdjs/pipeline-server";

await startServer({
  port: 3030,
  sources: [
    { id: "local", kind: "local", path: "./pipelines" },
  ],
});
```

### Embed in an existing H3 app

```ts
import { createApp, createDatabase, runMigrations } from "@ucdjs/pipeline-server";

const db = createDatabase();
await runMigrations(db);

const app = createApp({
  db,
  sources: [
    { id: "local", kind: "local", path: "./pipelines" },
  ],
  workspaceId: "my-workspace",
});
```

> [!NOTE]
> Full documentation is available at [docs.ucdjs.dev/packages/pipelines-server](https://docs.ucdjs.dev/packages/pipelines-server).

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/pipeline-server?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/pipeline-server
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/pipeline-server?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/pipeline-server
