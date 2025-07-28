/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
import assert from "node:assert";
import path from "node:path";
import NodeFileSystemBridge from "@ucdjs/fs-bridge/node";
import { createUCDStore, UCDStore } from "../src/store";

const basePath = path.resolve(import.meta.dirname, ".local");

const store = await createUCDStore({
  mode: "local",
  basePath,
  versions: ["15.0.0", "16.0.0", "17.0.0"],
  fs: NodeFileSystemBridge,
});

assert(store instanceof UCDStore, "store should be an instance of UCDStore");
assert(store.mode === "local", "store mode should be local");
assert(store.baseUrl != null, "store baseUrl should not be null");
assert(store.proxyUrl != null, "store proxyUrl should not be null");
assert(store.versions.length > 0, "store should have versions");

console.log(store);
