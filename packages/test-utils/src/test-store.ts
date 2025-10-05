import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { PathFilterOptions } from "@ucdjs/shared";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { DirectoryJSON } from "vitest-testdirs";
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
  structure?: DirectoryJSON;

  /**
   * Store manifest content (only used when no custom fs is provided)
   * Will be written to .ucd-store.json
   * @example
   * {
   *   "15.0.0": "15.0.0"
   * }
   */
  manifest?: UCDStoreManifest;

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
  mockApi?: boolean | Omit<MockStoreConfig, "versions" | "baseUrl">;
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

async function loadNodeBridge(basePath: string): Promise<FileSystemBridge> {
  const NodeFileSystemBridge = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);
  if (!NodeFileSystemBridge) {
    throw new Error("Node.js FileSystemBridge could not be loaded");
  }
  return NodeFileSystemBridge({ basePath });
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
  const versions = options.versions ?? ["16.0.0", "15.1.0", "15.0.0"];
  const baseUrl = options.baseUrl ?? "https://api.ucdjs.dev";

  if (options.mockApi) {
    const mockConfig: MockStoreConfig = {
      baseUrl,
      versions,
      responses: options.mockApi === true ? undefined : options.mockApi.responses,
    };

    // Include manifest in mocked responses so the store can read it
    if (options.manifest) {
      mockConfig.responses = {
        ...mockConfig.responses,
        "/api/v1/files/.ucd-store.json": options.manifest,
      };
    }

    mockStoreApi(mockConfig);
  }

  let storePath: string | undefined;
  let fs: FileSystemBridge;

  if (options.fs) {
    fs = options.fs;
    storePath = options.basePath;
  } else if (options.structure || options.manifest) {
    const structure: DirectoryJSON = { ...options.structure };
    if (options.manifest) {
      structure[".ucd-store.json"] = JSON.stringify(options.manifest);
    }

    storePath = await testdir(structure);
    fs = await loadNodeBridge(storePath);
  } else {
    storePath = options.basePath || "";
    fs = await loadNodeBridge(storePath);
  }

  const { createUCDStore } = await import("@ucdjs/ucd-store");
  const store = createUCDStore({
    fs,
    basePath: storePath || "",
    baseUrl,
    versions,
    globalFilters: options.globalFilters,
  });

  if (options.autoInit !== false) {
    await store.init();
  }

  return { store, storePath };
}
