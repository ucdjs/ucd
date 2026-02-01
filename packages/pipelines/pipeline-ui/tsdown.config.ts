import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
  ],
  format: "esm",
  inputOptions: {
    transform: {
      jsx: "react-jsx",
    },
  },
});
