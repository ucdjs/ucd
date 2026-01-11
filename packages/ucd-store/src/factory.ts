import type z from "zod";
import type { UCDStore, UCDStoreOptions } from "./types";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { patheResolve } from "@ucdjs/path-utils";
import { createUCDStore } from "./store";

/**
 * Creates a new UCD store instance configured for Node.js file system access.
 *
 * This function simplifies the creation of a Node.js UCD store by:
 * - Automatically loading the Node.js file system bridge with full capabilities
 * - Setting up local file storage with write/read capabilities
 * - Initializing the store with the specified options
 *
 * @param {{ basePath?: string } & Omit<UCDStoreOptions, "fs" | "fsOptions">} options - Configuration options for the Node.js UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance with Node.js filesystem capabilities
 */
export async function createNodeUCDStore<BridgeOptionsSchema extends z.ZodType>(options: { basePath?: string } & Omit<UCDStoreOptions<BridgeOptionsSchema>, "fs" | "fsOptions"> = {}): Promise<UCDStore> {
  const nodeFs = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);

  if (!nodeFs) {
    throw new Error("Node.js FileSystemBridge could not be loaded");
  }

  // Resolve basePath to absolute path for the fs-bridge
  // The bridge handles all path resolution - store operations use relative paths
  const resolvedBasePath = options.basePath ? patheResolve(options.basePath) : patheResolve("./");

  // Remove basePath from options since it's only for fsOptions
  const { basePath: _, ...storeOptions } = options;

  return createUCDStore({
    ...storeOptions,
    fs: nodeFs,
    fsOptions: { basePath: resolvedBasePath },
  });
}

/**
 * Creates a new UCD store instance configured for HTTP access.
 *
 * This function simplifies the creation of an HTTP UCD store by:
 * - Automatically loading the HTTP file system bridge with read-only capabilities
 * - Configuring for remote data access via the store subdomain (ucd-store.ucdjs.dev)
 * - Initializing the store with the specified options
 *
 * The HTTP store uses the dedicated store subdomain which provides direct access
 * to version files without requiring the /ucd/ path prefix.
 *
 * @param {Omit<UCDStoreOptions, "fs">} options - Configuration options for the HTTP UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance with HTTP filesystem capabilities
 */
export async function createHTTPUCDStore<BridgeOptionsSchema extends z.ZodType>(options: Omit<UCDStoreOptions<BridgeOptionsSchema>, "fs"> = {}): Promise<UCDStore> {
  const httpFsBridge = await import("@ucdjs/fs-bridge/bridges/http").then((m) => m.default);

  if (!httpFsBridge) {
    throw new Error("HTTP FileSystemBridge could not be loaded");
  }

  return createUCDStore({
    ...options,
    fs: httpFsBridge,
    fsOptions: {
      // Use the store subdomain directly - it handles /ucd/ internally
      baseUrl: UCDJS_STORE_BASE_URL,
    },
  });
}
