import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/bridges/node.ts",
    "./src/bridges/http.ts",
    "./src/errors.ts",
  ],
  // TODO:
  // This should probably just be bundled in the shared package.
  // and then redistributed that way.
  noExternal: [
    "@luxass/msw-utils",
  ],
  inlineOnly: [
    "@luxass/msw-utils",
  ],
});
