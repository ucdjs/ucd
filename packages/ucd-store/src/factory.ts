import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import type { LocalUCDStoreOptions, RemoteUCDStoreOptions, UCDStoreOptions } from "./types";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { UCDStore } from "./store";

/**
 * Creates a new UCD store instance with the specified options.
 *
 * @param {UCDStoreOptions} options - Configuration options for the UCD store
 * @returns {Promise<UCDStore>} A fully initialized UCDStore instance
 */
export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStore> {
  const store = new UCDStore(options);

  await store.initialize();

  return store;
}

/**
 * Creates a new UCD store instance configured for local file system access.
 *
 * This function simplifies the creation of a local UCD store by:
 * - Setting the mode to "local" automatically
 * - Loading the Node.js file system bridge if not provided
 * - Initializing the store with the specified options
 *
 * @param {LocalUCDStoreOptions} options - Configuration options for the local UCD store
 * @returns {Promise<UCDStore>} A fully initialized local UCDStore instance
 */
export async function createLocalUCDStore(options: LocalUCDStoreOptions = {}): Promise<UCDStore> {
  const fs = options.fs || await import("@ucdjs/utils/fs-bridge/node").then((m) => m.default);

  if (!fs) {
    throw new Error("FileSystemBridge is required for local UCD store");
  }

  const store = new UCDStore({
    ...options,
    mode: "local",
    fs,
  });

  await store.initialize();

  return store;
}

/**
 * Creates a new UCD store instance configured for remote access via HTTP.
 *
 * This function simplifies the creation of a remote UCD store by:
 * - Setting the mode to "remote" automatically
 * - Loading the HTTP file system bridge if not provided
 * - Initializing the store with the specified options
 *
 * @param {RemoteUCDStoreOptions} options - Configuration options for the remote UCD store
 * @returns {Promise<UCDStore>} A fully initialized remote UCDStore instance
 */
export async function createRemoteUCDStore(options: RemoteUCDStoreOptions = {}): Promise<UCDStore> {
  let fsInstance: FileSystemBridge;

  if (options.fs) {
    fsInstance = options.fs;
  } else {
    const httpFsBridge = await import("@ucdjs/utils/fs-bridge/http").then((m) => m.default);
    fsInstance = typeof httpFsBridge === "function"
      ? httpFsBridge({
          baseUrl: `${options.baseUrl || UCDJS_API_BASE_URL}/api/v1/unicode-proxy/`,
        })
      : httpFsBridge;
  }

  const store = new UCDStore({
    ...options,
    mode: "remote",
    fs: fsInstance,
  });

  await store.initialize();

  return store;
}
