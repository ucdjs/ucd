import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/bridges/node.ts",
    "./src/bridges/http.ts",
  ],
});
