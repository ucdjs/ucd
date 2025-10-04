import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    "index": "./src/index.ts",
    "msw": "./src/msw.ts",
    "store": "./src/store.ts",
    "vitest-setup": "./src/msw/global-setup.ts",
  },
});
