import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/ucd-files.ts",
    "./src/constants.ts",

    // fs-bridge
    "./src/fs-bridge.ts",
    "./src/fs-bridge/node.ts",
    "./src/fs-bridge/http.ts",
  ],
  exports: true,
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  publint: true,
  tsconfig: "./tsconfig.build.json",
});
