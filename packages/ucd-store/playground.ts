// TODO: remove this file when implementation is finalized.
import assert from "node:assert";
import { UCDStore } from "./src/store";

const store = new UCDStore({
  local: true,
  versions: ["15.0.0", "16.0.0", "17.0.0"],
});

assert(store instanceof UCDStore, "store should be an instance of UCDStore");
assert(store.mode === "local", "store mode should be 'local'");

// eslint-disable-next-line antfu/no-top-level-await
await store.load();
assert(store.isPopulated, "store should be loaded");
assert(store.basePath != null, "store basePath should not be null");
assert(store.versions.length > 0, "store should have versions");
assert(store.hasVersion("15.0.0"), "store should have version 15.0.0");
assert(store.hasVersion("16.0.0"), "store should have version 16.0.0");
assert(store.hasVersion("17.0.0"), "store should have version 17.0.0");
console.log(store);
