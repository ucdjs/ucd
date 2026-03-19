import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    index: "./src/index.ts",
    traces: "./src/traces.ts",
    shared: "./src/shared.ts",
    node: "./src/runtime/node.ts",
  },
});
