import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/tasks.ts",
    "./src/environment.ts",
    "./src/constants.ts",

    // setups
    "./src/setups.ts",
  ],
  exports: true,
});
