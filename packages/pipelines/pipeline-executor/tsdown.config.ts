import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    graph: "./src/graph.ts",
    index: "./src/index.ts",
    node: "./src/runtime/node.ts",
  },
});
