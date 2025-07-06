/* eslint-disable antfu/no-top-level-await */

import assert from "node:assert";
import { join } from "node:path";
import NodeFileSystemBridge from "@ucdjs/utils/fs-bridge/node";
import { createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createLogger } from "./_utils";

const log = createLogger("node-playground");

const basePath = join(import.meta.dirname, ".local");
log.info("Base path for UCD Store:", basePath);

log.info("Starting Node Playground for UCD Store");
const store = await createUCDStore({
  basePath,
  fs: NodeFileSystemBridge,
});

log.info("UCD Store created successfully");

assert(store instanceof UCDStore, "store should be an instance of UCDStore");

log.info("Store basePath:", store.basePath);
assert(store.basePath === basePath, "store basePath should be set correctly");

// fs capabilities
assert(store.fs.capabilities != null, "store should have file system capabilities");
assert(store.fs.capabilities.read, "store should support reading files");
assert(store.fs.capabilities.write, "store should support writing files");
assert(store.fs.capabilities.listdir, "store should support listing directories");
assert(store.fs.capabilities.mkdir, "store should support creating directories");
assert(store.fs.capabilities.stat, "store should support file stats");
assert(store.fs.capabilities.exists, "store should support checking file existence");
assert(store.fs.capabilities.rm, "store should support removing files");

// capabilities
assert(store.capabilities != null, "store should have capabilities");
assert(store.capabilities.mirror, "store should support mirroring files");
assert(store.capabilities.analyze, "store should support analyzing files");
assert(store.capabilities.clean, "store should support cleaning files");
assert(store.capabilities.repair, "store should support repairing files");

log.info("All capability assertions passed");

// Check if local directory exists
const localDirExists = await store.fs.exists("./ucd-data");
log.info("Local UCD data directory exists:", localDirExists);

if (!localDirExists) {
  log.info("Creating local UCD data directory...");
  await store.fs.mkdir("./ucd-data");
  log.info("Local UCD data directory created");
}

// Test basic file operations
try {
  const testFile = "./ucd-data/test.txt";
  await store.fs.write(testFile, "Hello, UCD Store!");
  const content = await store.fs.read(testFile);
  assert(content === "Hello, UCD Store!", "file content should match");
  log.info("File write/read test passed");

  // Clean up test file
  await store.fs.rm(testFile);
  log.info("Test file cleaned up");
} catch (error) {
  log.error("File operation test failed:", error);
}

log.info("Node playground completed successfully");
