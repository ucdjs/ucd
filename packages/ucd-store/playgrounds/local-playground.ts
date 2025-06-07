/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
import assert from "node:assert";
import path from "node:path";
import { LocalUCDStore } from "../src/local";
import { createUCDStore } from "../src/store";

const basePath = path.resolve(__dirname, ".local");

console.log(basePath);

const store = await createUCDStore("local", {
  basePath: "./ucd-files",
  versions: ["15.0.0", "16.0.0", "17.0.0"],
});

assert(store instanceof LocalUCDStore, "store should be an instance of LocalUCDStore");

assert(store.basePath != null, "store basePath should not be null");
assert(store.versions.length > 0, "store should have versions");

console.log(store);
