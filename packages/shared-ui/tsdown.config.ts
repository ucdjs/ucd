import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/lib/*.ts",
    "./src/hooks/*.ts",
    "./src/ui/*.tsx",
  ],
  format: "esm",
  exports: {
    customExports(exports) {
      exports["./styles/globals.css"] = "./src/styles/globals.css";
      exports["./package.json"] = "./package.json";
      return exports;
    },
    packageJson: false,
  },
  inputOptions: {
    transform: {
      jsx: "react-jsx",
    },
  },
});
