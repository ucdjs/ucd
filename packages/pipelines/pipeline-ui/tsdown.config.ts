import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
  ],
  exports: {
    customExports(exports) {
      exports["./styles/globals.css"] = "./src/styles/globals.css";
      exports["./package.json"] = "./package.json";

      return exports;
    },
    packageJson: false,
  },
  format: "esm",
  inputOptions: {
    transform: {
      jsx: "react-jsx",
    },
  },
});
