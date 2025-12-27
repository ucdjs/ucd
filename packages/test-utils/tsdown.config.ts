import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    "index": "./src/index.ts",
    "msw": "./src/msw.ts",
    "mock-store": "./src/mock-store/index.ts",
    "msw/vitest-setup": "./src/msw/vitest-setup.ts",
    "fs-bridges/index": "./src/fs-bridges/index.ts",
    "matchers/vitest-setup": "./src/matchers/vitest-setup.ts",
    "matchers/types": "./src/matchers/types.d.ts",
  },
  external: [
    "vitest",
    /^@vitest\//,
  ],
});
