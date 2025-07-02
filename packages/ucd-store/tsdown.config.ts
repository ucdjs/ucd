import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/ucd-files.ts",
  ],
});
