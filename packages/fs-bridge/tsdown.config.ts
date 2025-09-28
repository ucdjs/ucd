import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/bridges/node.ts",
    "./src/bridges/http.ts",
  ],
});
