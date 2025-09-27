import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  dts: false,
  exports: false,
  publint: false,
  external: [
    "vscode",
  ],
  // Bundle workspace packages so they're included in the extension
  noExternal: [
    /^@ucdjs\//,
  ],
});
