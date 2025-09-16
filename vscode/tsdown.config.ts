import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  dts: false,
  external: [
    "vscode",
  ],
});
