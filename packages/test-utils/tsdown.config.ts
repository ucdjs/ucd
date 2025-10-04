import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: {
    "index": "./src/index.ts",
    "msw": "./src/msw.ts",
    "mock-store": "./src/mock-store/index.ts",
    "msw/vitest-setup": "./src/msw/vitest-setup.ts",
  },
  external: [
    "vitest",
    /^@vitest\//,
  ],
});
