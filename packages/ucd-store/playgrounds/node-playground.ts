/* eslint-disable antfu/no-top-level-await */
import assert from "node:assert";
import { join } from "node:path";
import { assertCapability } from "@ucdjs/fs-bridge";
import NodeFileSystemBridge from "@ucdjs/fs-bridge/bridges/node";
import { createUCDStore } from "../src/factory";
import { UCDStore } from "../src/store";
import { createLogger } from "./__utils";

const log = createLogger("node-playground");

const basePath = join(import.meta.dirname, ".local");
log.info("Base path for UCD Store:", basePath);

log.info("Starting Node Playground for UCD Store");
const store = createUCDStore({
  basePath,
  fs: NodeFileSystemBridge({
    basePath,
  }),
  versions: [
    "15.1.0",
  ],
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
assert(store.fs.capabilities.exists, "store should support checking file existence");
assert(store.fs.capabilities.rm, "store should support removing files");

assertCapability(store.fs, ["read", "write", "listdir", "mkdir", "exists", "rm"]);

log.info("All capability assertions passed");

// check if local directory exists
const localDirExists = await store.fs.exists("./ucd-data");
log.info("Local UCD data directory exists:", localDirExists);

if (!localDirExists) {
  log.info("Creating local UCD data directory...");
  await store.fs.mkdir("./ucd-data");
  log.info("Local UCD data directory created");
}

// test basic file operations
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

// initialize the store with a single version
await store.init();

// analyze the store
const [analyze, error] = await store.analyze({
  versions: ["15.1.0"],
  checkOrphaned: true,
});

assert(analyze != null, "store analysis should succeed");
assert(error == null, "store analysis should not return an error");
assert(analyze[0], "analysis should contain data");

const [analysis] = analyze;
log.info("Store analysis results:", analysis);

assert(analysis.version === "15.1.0", "analysis should contain the correct version");
assert(analysis.orphanedFiles.length === 0, "there should be no orphaned files");
log.info("Store initialized and analyzed successfully");

// write orphaned files to the store
await store.fs.write("./15.1.0/orphaned.txt", "This is an orphaned file");
log.info("Orphaned file written to the store");

const [newAnalyzes, newError] = await store.analyze({
  versions: ["15.1.0"],
  checkOrphaned: true,
});

assert(newAnalyzes != null, "new store analysis should succeed");
assert(newError == null, "new store analysis should not return an error");
assert(newAnalyzes[0], "new analysis should contain data");

const [newAnalysis] = newAnalyzes;
log.info("New store analysis results after writing orphaned file:", newAnalysis);
assert(newAnalysis.orphanedFiles.length === 1, "there should be one orphaned file");

log.info("Node playground completed successfully");
