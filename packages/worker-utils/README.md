# @ucdjs-internal/worker-utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

Shared worker utilities for the UCD.js API and Store workers.

## Installation

```bash
npm install @ucdjs-internal/worker-utils
```

## Usage

```ts
import {
  badRequest,
  errorHandler,
  notFoundHandler,
} from "@ucdjs-internal/worker-utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => {
  const name = c.req.query("name");

  if (!name) {
    return badRequest(c, { message: "Missing name query parameter" });
  }

  return c.json({
    message: `Hello ${name}!`,
  });
});

app.notFound(notFoundHandler);
app.onError(errorHandler);

export default app;
```

## Notes

The environment helpers are shared by the API and Store workers.
`production` resolves to the public `ucdjs.dev` origins, `preview` includes preview worker origins, and local or unknown environments fall back to localhost-style defaults.

The CORS setup helpers build on those defaults so each worker does not need to duplicate its own origin lists.

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs-internal/worker-utils?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs-internal/worker-utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs-internal/worker-utils?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs-internal/worker-utils
