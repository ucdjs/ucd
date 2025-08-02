/* eslint-disable antfu/no-top-level-await */

import assert from "node:assert";
import HTTPFileSystemBridge from "@ucdjs/fs-bridge/bridges/http";
import { __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ } from "@ucdjs/fs-bridge/internal";
import { createUCDStore, UCDStore } from "@ucdjs/ucd-store";
import { createLogger } from "./__utils";

const log = createLogger("http-playground");

log.info("Starting HTTP Playground for UCD Store");
const store = await createUCDStore({
  basePath: "/api/v1/unicode-proxy",
  fs: HTTPFileSystemBridge({
    baseUrl: "https://api.ucdjs.dev",
  }),
});

log.info("UCD Store created successfully");

assert(store instanceof UCDStore, "store should be an instance of UCDStore");

log.info("Store basePath:", store.basePath);
assert(store.basePath === "/api/v1/unicode-proxy", "store basePath should be set correctly");

const storeFSCapabilities = store.fs[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];

// fs capabilities
assert(storeFSCapabilities != null, "store should have file system capabilities");
assert(storeFSCapabilities.read, "store should support reading files");
assert(storeFSCapabilities.write === false, "store should not support writing files");
assert(storeFSCapabilities.listdir, "store should support listing directories");
assert(storeFSCapabilities.mkdir === false, "store should not support creating directories");
assert(storeFSCapabilities.exists, "store should support checking file existence");
assert(storeFSCapabilities.rm === false, "store should not support removing files");

// capabilities
assert(store.capabilities != null, "store should have capabilities");
assert(store.capabilities.mirror === false, "store should not support mirroring files");
assert(store.capabilities.analyze, "store should support analyzing files");
assert(store.capabilities.clean === false, "store should not support cleaning files");
assert(store.capabilities.repair === false, "store should not support repairing files");

// versions
assert(store.versions != null, "store should have versions");
assert(Array.isArray(store.versions), "store.versions should be an array");
assert(store.versions.length > 0, "store.versions should not be empty");

log.info("Store versions:", store.versions);

// file structure

const fileStructure = await store.getFileTree("16.0.0");
log.info("File structure for version 16.0.0:", fileStructure);

assert(Array.isArray(fileStructure), "file structure should be an array");
assert(fileStructure.length > 0, "file structure should not be empty");

fileStructure.forEach((file) => {
  assert(typeof file.name === "string", "file name should be a string");
  assert(typeof file.path === "string", "file path should be a string");
});

log.info("File structure validation passed");

// get specific file
const fileContent = await store.getFile("16.0.0", "ucd/UnicodeData.txt");
log.info("File content for UnicodeData.txt:", fileContent.slice(0, 100));

assert(typeof fileContent === "string", "file content should be a string");
assert(fileContent.length > 0, "file content should not be empty");
