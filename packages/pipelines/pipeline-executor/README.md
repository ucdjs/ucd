# @ucdjs/pipelines-executor

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

> [!IMPORTANT]
> This is an internal package. It may change without warning and is not subject to semantic versioning. Use at your own risk.

A collection of core pipeline functionalities for the UCD project.

## What It Does

`@ucdjs/pipelines-executor` executes pipeline definitions from `@ucdjs/pipelines-core`.

It is responsible for:

- running pipeline routes in dependency order
- handling concurrency and cache usage
- emitting execution events
- integrating with optional runtime-specific execution context adapters
- building the runtime context objects passed into pipeline code

It does not persist execution state by itself. Hosts such as `pipeline-server` decide how
to store events, logs, and execution history.

## Runtime Contexts

The executor passes context objects into pipeline filters, parsers, resolvers, fallback
handlers, transforms, and artifact builders.

Those contexts now include `logger`, which is the preferred API for pipeline-authored logging:

```ts
resolver: async (ctx, rows) => {
  ctx.logger.info("Resolving rows", { file: ctx.file.path });
  return [];
};
```

In this stage, the logger is additive and safe to use, but it is intentionally inert until
later stages wire it to executor-owned log emission and host persistence.

## Log Emission

The executor can emit logs to a host-provided callback:

```ts
const executor = createPipelineExecutor({
  onLog: (entry) => {
    // persist, stream, or inspect logs here
  },
});
```

When a runtime provides execution context, the executor can emit:

- explicit `ctx.logger.*` calls from pipeline code
- captured `console.log/info/warn/error` output
- optional captured `process.stdout.write` / `process.stderr.write`

Node-specific output interception is configured through the `./node` runtime adapter:

```ts
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { createNodeExecutionRuntime } from "@ucdjs/pipelines-executor/node";

const executor = createPipelineExecutor({
  runtime: createNodeExecutionRuntime({
    outputCapture: {
      console: true,
      stdio: true,
    },
  }),
  onLog,
});
```

Logs are emitted incrementally and are not returned from `run()`. Persistence remains the
responsibility of the host application.

## Installation

```bash
npm install @ucdjs/pipelines-executor
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/pipelines-executor?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/pipelines-executor
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/pipelines-executor?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/pipelines-executor
