import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/bridges/node.ts",
    "./src/bridges/http.ts",
    "./src/errors.ts",
  ],
  deps: {
    // TODO:
    // This should probably just be bundled in the shared package.
    // and then redistributed that way.
    alwaysBundle: [
      "@luxass/msw-utils",
    ],
    onlyBundle: [
      "@luxass/msw-utils",
    ],
  },
});
