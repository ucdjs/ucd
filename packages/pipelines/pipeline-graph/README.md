# @ucdjs/pipelines-graph

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

> [!IMPORTANT]
> This is an internal package. It may change without warning and is not subject to semantic versioning. Use at your own risk.

A collection of core pipeline functionalities for the UCD project.

## Installation

```bash
npm install @ucdjs/pipelines-graph
```

## Usage

This package keeps graph construction and graph inspection separate from pipeline definition loading and execution.
Use it when you already have a pipeline definition or execution graph and need a stable graph-shaped view for tooling, visualization, or debugging.

```ts
import { buildRouteGraph, toVisualTree } from "@ucdjs/pipelines-graph";
import { buildDAG } from "@ucdjs/pipelines-core";

const dag = buildDAG(pipeline.routes);
const graph = buildRouteGraph(pipeline, dag);

console.log(toVisualTree(graph));
```

Example output:

```txt
└─ route:static:emoji
   ├─ route:static:groups
   └─ route:static:summary
```

## 📄 License

Published under [MIT License](./LICENSE).

[npm-version-src]: https://img.shields.io/npm/v/@ucdjs/pipelines-graph?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@ucdjs/pipelines-graph
[npm-downloads-src]: https://img.shields.io/npm/dm/@ucdjs/pipelines-graph?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@ucdjs/pipelines-graph
