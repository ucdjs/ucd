import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    index: "./src/index.ts",
    fields: "./src/fields/run.ts",
  },
});
