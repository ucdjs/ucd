/* eslint-disable antfu/no-top-level-await */

import assert from "node:assert";
import HttpFileSystemBridge from "@ucdjs/utils/fs-bridge/http";
import { createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createLogger } from "./_utils";

const log = createLogger("http-playground");

log.info("Starting HTTP Playground for UCD Store");
const store = await createUCDStore({
  basePath: "/api/v1/unicode-proxy",
  fs: HttpFileSystemBridge({
    baseUrl: "https://api.ucdjs.dev",
  }),
});

log.info("UCD Store created successfully");

assert(store instanceof UCDStore, "store should be an instance of UCDStore");

log.info("Store basePath:", store.basePath);
assert(store.basePath === "/api/v1/unicode-proxy", "store basePath should be set correctly");

// fs capabilities
assert(store.fs.capabilities != null, "store should have file system capabilities");
assert(store.fs.capabilities.read, "store should support reading files");
assert(store.fs.capabilities.write === false, "store should not support writing files");
assert(store.fs.capabilities.listdir, "store should support listing directories");
assert(store.fs.capabilities.mkdir === false, "store should not support creating directories");
assert(store.fs.capabilities.stat, "store should support file stats");
assert(store.fs.capabilities.exists, "store should support checking file existence");
assert(store.fs.capabilities.rm === false, "store should not support removing files");

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

// require capabilities
try {
  await store.clean();
  assert.fail("store.clean should throw an error");
} catch (error) {
  assert(error instanceof Error, "store.clean should throw an Error");
  log.info("store.clean threw an error as expected:", error.message);
}

try {
  await store.repair();
  assert.fail("store.repair should throw an error");
} catch (error) {
  assert(error instanceof Error, "store.repair should throw an Error");
  log.info("store.repair threw an error as expected:", error.message);
}

try {
  await store.mirror({ versions: ["16.0.0"] });
  assert.fail("store.mirror should throw an error");
} catch (error) {
  assert(error instanceof Error, "store.mirror should throw an Error");
  log.info("store.mirror threw an error as expected:", error.message);
}
