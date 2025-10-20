/* eslint-disable antfu/no-top-level-await */

import { createDebugger } from "@ucdjs-internal/shared";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import HTTPFileSystemBridge from "@ucdjs/fs-bridge/bridges/http";
import { createUCDStore } from "../src/store";

const debug = createDebugger("ucdjs:ucd-store:http-playground");

debug?.("Starting HTTP Playground for UCD Store");
debug?.("Using API:", UCDJS_API_BASE_URL);

// initialize http file system bridge (read-only)
const fs = HTTPFileSystemBridge({
  baseUrl: new URL("/api/v1/files", UCDJS_API_BASE_URL).href,
});

debug?.("Creating UCD Store with HTTP bridge...");

// create store with bootstrap enabled
const store = await createUCDStore({
  fs,
  basePath: "",
  versions: ["16.0.0", "15.1.0"],
  bootstrap: true,
  globalFilters: {
    include: ["**/*.txt"],
  },
});

debug?.("Store created successfully!");
debug?.("Available versions:", store.versions);

// Test getFilePaths
debug?.("\n--- Testing getFilePaths for version 16.0.0 ---");
const [paths, pathsError] = await store.getFilePaths("16.0.0");

if (pathsError) {
  debug?.("Failed to get file paths:", pathsError.message);
} else {
  debug?.(`Found ${paths.length} files`);
  debug?.("First 10 files:", paths.slice(0, 10));
}

// Test getFilePaths with additional filters
debug?.("\n--- Testing getFilePaths with extra filters (only UnicodeData.txt) ---");
const [filteredPaths, filteredPathsError] = await store.getFilePaths("16.0.0", {
  filters: {
    include: ["**/UnicodeData.txt"],
  },
});

if (filteredPathsError) {
  debug?.("Failed to get filtered paths:", filteredPathsError.message);
} else {
  debug?.(`Found ${filteredPaths.length} matching files:`, filteredPaths);
}

// Test getFileTree
debug?.("\n--- Testing getFileTree for version 16.0.0 ---");
const [tree, treeError] = await store.getFileTree("16.0.0");

if (treeError) {
  debug?.("Failed to get file tree:", treeError.message);
} else {
  debug?.(`File tree has ${tree.length} top-level entries`);
  debug?.("Top-level entries:", tree.map((entry) => ({ name: entry.name, type: entry.type })));
}

// Test getFile
debug?.("\n--- Testing getFile for UnicodeData.txt ---");
const [fileContent, fileError] = await store.getFile("16.0.0", "UnicodeData.txt");

if (fileError) {
  debug?.("Failed to get file:", fileError.message);
} else {
  const lines = fileContent.split("\n");
  debug?.(`File loaded: ${fileContent.length} bytes, ${lines.length} lines`);
  debug?.("First 3 lines:");
  lines.slice(0, 3).forEach((line, i) => debug?.(`  ${i + 1}: ${line}`));
}

// Test getFile with cache disabled (HTTP bridge doesn't support write anyway)
debug?.("\n--- Testing getFile with cache disabled ---");
const [fileContent2, fileError2] = await store.getFile("16.0.0", "UnicodeData.txt", {
  cache: false,
});

if (fileError2) {
  debug?.("Failed to get file:", fileError2.message);
} else {
  debug?.(`File loaded again: ${fileContent2.length} bytes`);
}

// Test error handling - invalid version
debug?.("\n--- Testing error handling (invalid version) ---");
const [, invalidVersionError] = await store.getFilePaths("99.0.0");

if (invalidVersionError) {
  debug?.("Expected error caught:", invalidVersionError.message);
}

// Test error handling - file doesn't pass filter
debug?.("\n--- Testing error handling (file filtered out) ---");
const [, filteredFileError] = await store.getFile("16.0.0", "SomeFile.html", {
  filters: {
    exclude: ["**/*.html"],
  },
});

if (filteredFileError) {
  debug?.("Expected error caught:", filteredFileError.message);
}

debug?.("\n✅ HTTP Playground completed successfully!");
