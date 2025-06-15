import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/ucd-files.ts",
    "./src/types.ts",
    "./src/memfs.ts",
  ],
  exports: true,
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  publint: true,
  tsconfig: "./tsconfig.build.json",
});
