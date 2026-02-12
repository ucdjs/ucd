import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/sources/index.ts",
    "./src/transforms/index.ts",
  ],
});
