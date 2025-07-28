import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: {
    index: "./src/index.ts",
    node: "./src/bridges/node.ts",
    http: "./src/bridges/http.ts",
  },
});
