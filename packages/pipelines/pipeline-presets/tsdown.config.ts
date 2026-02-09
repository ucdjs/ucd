import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/parsers/index.ts",
    "./src/transforms/index.ts",
    "./src/resolvers/index.ts",
    "./src/sources/index.ts",
    "./src/routes/index.ts",
    "./src/pipelines/index.ts",
  ],
});
