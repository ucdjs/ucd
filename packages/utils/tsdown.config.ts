import { createTsdownConfig } from "@ucdjs/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/constants.ts",

    // fs-bridge
    "./src/fs-bridge.ts",
    "./src/fs-bridge/node.ts",
    "./src/fs-bridge/http.ts",
  ],
});
