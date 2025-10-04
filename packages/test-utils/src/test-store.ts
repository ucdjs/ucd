import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { PathFilterOptions } from "@ucdjs/shared";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { MockStoreConfig } from "./mock-store";
import { testdir } from "vitest-testdirs";
import { mockStoreApi } from "./mock-store";

export interface CreateTestStoreOptions {
  /**
   * File structure to create in testdir (only used when no custom fs is provided)
   * @example
   * {
   *   "15.0.0": {
   *     "ArabicShaping.txt": "content"
   *   }
   * }
   */
  structure?: Record<string, any>;

  /**
   * Store manifest content (only used when no custom fs is provided)
   * Will be written to .ucd-store.json
   * @example
   * {
   *   "15.0.0": "15.0.0"
   * }
   */
  manifest?: Record<string, string>;

  /**
   * Unicode versions to use in the store
   */
  versions?: string[];

  /**
   * Base URL for the Unicode API
   * @default "https://api.ucdjs.dev"
   */
  baseUrl?: string;

  /**
   * Base path for the store
   * When using structure/manifest, this will be set to the testdir path
   */
  basePath?: string;

  /**
   * Global filters to apply when fetching Unicode data
   */
  globalFilters?: PathFilterOptions;

  /**
   * Custom filesystem bridge
   * If not provided and structure/manifest are given, a Node.js bridge will be created
   * If not provided and no structure/manifest, a Node.js bridge with basePath will be created
   */
  fs?: FileSystemBridge;

  /**
   * Whether to automatically initialize the store
   * @default true
   */
  autoInit?: boolean;

  /**
   * Optional API mocking configuration
   * - `true`: Use default mockStoreApi configuration
   * - `MockStoreConfig`: Custom mockStoreApi configuration
   * - `undefined`/`false`: Don't setup API mocking (useful when mocking is done in beforeEach)
   */
  mockApi?: boolean | MockStoreConfig;
}

export interface CreateTestStoreResult {
  /**
   * The created UCD store instance
   */
  store: UCDStore;

  /**
   * Path to the test directory (only present when using structure/manifest or basePath)
   */
  storePath?: string;
}

/**
 * Creates a test UCD store with optional file structure and API mocking
 *
 * @example
 * // Simple Node store with testdir
 * const { store, storePath } = await createTestStore({
 *   structure: { "15.0.0": { "file.txt": "content" } },
 *   versions: ["15.0.0"]
 * });
 *
 * @example
 * // With API mocking
 * const { store } = await createTestStore({
 *   structure: { "15.0.0": { "file.txt": "content" } },
 *   mockApi: true
 * });
 *
 * @example
 * // Custom filesystem bridge
 * const { store } = await createTestStore({
 *   fs: HTTPFileSystemBridge({ baseUrl: "https://api.ucdjs.dev" }),
 *   versions: ["15.0.0"]
 * });
 */
export async function createTestStore(
  options: CreateTestStoreOptions = {},
): Promise<CreateTestStoreResult> {
  // Setup API mocking if requested
  if (options.mockApi) {
    if (options.mockApi === true) {
      mockStoreApi();
    } else {
      mockStoreApi(options.mockApi);
    }
  }

  let storePath: string | undefined;
  let fs: FileSystemBridge;

  if (options.fs) {
    // Custom bridge provided - use as-is
    fs = options.fs;
    storePath = options.basePath;
  } else if (options.structure || options.manifest) {
    // Auto-create testdir + Node bridge
    const testdirStructure: Record<string, any> = {
      ...options.structure,
    };

    if (options.manifest) {
      testdirStructure[".ucd-store.json"] = JSON.stringify(options.manifest);
    }

    storePath = await testdir(testdirStructure);

    // Dynamically import Node bridge
    const NodeFileSystemBridge = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);
    if (!NodeFileSystemBridge) {
      throw new Error("Node.js FileSystemBridge could not be loaded");
    }

    fs = NodeFileSystemBridge({ basePath: storePath });
  } else {
    // Default Node bridge with optional basePath
    const NodeFileSystemBridge = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);
    if (!NodeFileSystemBridge) {
      throw new Error("Node.js FileSystemBridge could not be loaded");
    }

    storePath = options.basePath || "";
    fs = NodeFileSystemBridge({ basePath: storePath });
  }

  // Create the store using the generic factory
  const { createUCDStore } = await import("@ucdjs/ucd-store");

  const store = createUCDStore({
    fs,
    basePath: storePath || "",
    baseUrl: options.baseUrl,
    versions: options.versions,
    globalFilters: options.globalFilters,
  });

  // Auto-initialize unless explicitly disabled
  if (options.autoInit !== false) {
    await store.init();
  }

  return {
    store,
    storePath,
  };
}
