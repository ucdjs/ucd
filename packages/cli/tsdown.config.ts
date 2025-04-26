import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/cli.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  publint: true,
  tsconfig: "./tsconfig.build.json",
});
