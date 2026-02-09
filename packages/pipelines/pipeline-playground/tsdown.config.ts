import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/simple.ucd-pipeline.ts",
    "./src/memory.ucd-pipeline.ts",
    "./src/sequence.ucd-pipeline.ts",
  ],
});
