/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
import assert from "node:assert";
import path from "node:path";
import { LocalUCDStore } from "../src/local";
import { createUCDStore } from "../src/store";

const basePath = path.resolve(import.meta.dirname, ".local");

const store = await createUCDStore("local", {
  basePath,
  versions: ["15.0.0", "16.0.0", "17.0.0"],
});

assert(store instanceof LocalUCDStore, "store should be an instance of LocalUCDStore");
assert(store.baseUrl != null, "store baseUrl should not be null");
assert(store.proxyUrl != null, "store proxyUrl should not be null");
assert(store.versions.length > 0, "store should have versions");

console.log(store);
