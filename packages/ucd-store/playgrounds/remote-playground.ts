/* eslint-disable antfu/no-top-level-await */
/* eslint-disable no-console */
import assert from "node:assert";
import HTTPFileSystemBridge from "@ucdjs/fs-bridge/http";
import { createUCDStore, UCDStore } from "../src/store";

const store = await createUCDStore({
  mode: "remote",
  fs: HTTPFileSystemBridge(),
});

assert(store instanceof UCDStore, "store should be an instance of UCDStore");
assert(store.mode === "remote", "store mode should be remote");

assert(store.baseUrl != null, "store baseUrl should not be null");
assert(store.proxyUrl != null, "store proxyUrl should not be null");
assert(store.versions.length > 0, "store should have versions");

console.log("[remote-store]", store.versions);

console.log("[remote-store] hasVersion: 15.0.0", store.hasVersion("15.0.0"));
console.log("[remote-store] hasVersion: 99.0.0", store.hasVersion("99.0.0"));

const filePathsForV16 = await store.getFilePaths("16.0.0");
assert(filePathsForV16.length > 0, "file paths for version 16.0.0 should not be empty");
console.log("[remote-store] file paths for 16.0.0:", filePathsForV16);

const fileContent = await store.getFile("16.0.0", "UnicodeData.txt");
console.log("[remote-store] file content for 16.0.0/UnicodeData.txt:", fileContent.slice(0, 100), "...");

assert(fileContent.length > 0, "file content should not be empty");
