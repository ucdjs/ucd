import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
  ],
  inputOptions: {
    resolve: {
      tsconfigFilename: "./tsconfig.json",
    },
  },
});
