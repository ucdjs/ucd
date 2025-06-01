/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
// TODO: remove this file when implementation is finalized.
import assert from "node:assert";
import { LocalUCDStore } from "./src/local";
import { createUCDStore } from "./src/store";

const store = await createUCDStore("local", {
  basePath: "./ucd-files",
  versions: ["15.0.0", "16.0.0", "17.0.0"],
});

assert(store instanceof LocalUCDStore, "store should be an instance of LocalUCDStore");

assert(store.isPopulated, "store should be loaded");
assert(store.basePath != null, "store basePath should not be null");
assert(store.versions.length > 0, "store should have versions");

console.log(store);
