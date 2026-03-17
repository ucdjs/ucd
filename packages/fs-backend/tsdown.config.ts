import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/backends/node.ts",
    "./src/backends/http.ts",
    "./src/errors.ts",
  ],
  deps: {
    alwaysBundle: [
      "@luxass/msw-utils",
    ],
    onlyBundle: [
      "@luxass/msw-utils",
    ],
  },
});
