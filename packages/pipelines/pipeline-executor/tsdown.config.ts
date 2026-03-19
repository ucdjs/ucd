import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    graph: "./src/run/graph.ts",
    index: "./src/index.ts",
    traces: "./src/run/traces.ts",
    shared: "./src/shared.ts",
    node: "./src/runtime/node.ts",
  },
});
