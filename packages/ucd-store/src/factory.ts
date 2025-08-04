import type { UCDStoreOptions } from "./types";
import { UCDStore } from "./store";

/**
 * Creates a new UCD store instance with the specified options.
 *
 * @param {UCDStoreOptions} options - Configuration options for the UCD store
 * @returns {UCDStore} A fully initialized UCDStore instance
 */
export function createUCDStore(options: UCDStoreOptions): UCDStore {
  return new UCDStore(options);
}

/**
 * Creates a new UCD store instance configured for Node.js file system access.
 *
 * This function simplifies the creation of a Node.js UCD store by:
 * - Automatically loading the Node.js file system bridge with full capabilities
 * - Setting up local file storage with write/read capabilities
 * - Initializing the store with the specified options
 *
 * @param {Omit<UCDStoreOptions, "fs">} options - Configuration options for the Node.js UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance with Node.js filesystem capabilities
 */
export async function createNodeUCDStore(options: Omit<UCDStoreOptions, "fs"> = {}): Promise<UCDStore> {
  const fs = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);

  if (!fs) {
    throw new Error("Node.js FileSystemBridge could not be loaded");
  }

  return new UCDStore({
    ...options,
    fs: fs({
      basePath: "./",
    }),
  });
}

/**
 * Creates a new UCD store instance configured for HTTP access.
 *
 * This function simplifies the creation of an HTTP UCD store by:
 * - Automatically loading the HTTP file system bridge with read-only capabilities
 * - Configuring for remote data access via HTTP/HTTPS
 * - Initializing the store with the specified options
 *
 * @param {Omit<UCDStoreOptions, "fs">} options - Configuration options for the HTTP UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance with HTTP filesystem capabilities
 */
export async function createHTTPUCDStore(options: Omit<UCDStoreOptions, "fs"> = {}): Promise<UCDStore> {
  const httpFsBridge = await import("@ucdjs/fs-bridge/bridges/http").then((m) => m.default);

  return new UCDStore({
    ...options,
    fs: httpFsBridge({
      baseUrl: options.baseUrl,
    }),
  });
}
