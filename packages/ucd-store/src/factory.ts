import type z from "zod";
import type { UCDStore, UCDStoreOptions } from "./types";
import { resolve } from "pathe";
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
  const resolvedBasePath = options.basePath ? resolve(options.basePath) : resolve("./");

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
 * - Configuring for remote data access via HTTP/HTTPS
 * - Initializing the store with the specified options
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
    fsOptions: (ctx) => ({
      baseUrl: new URL(ctx.endpointConfig.endpoints.files, ctx.baseUrl).toString(),
    }),
  });
}
