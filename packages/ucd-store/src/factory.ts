import type { UCDStore, UCDStoreOptions } from "./types";
import type z from "zod";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { patheResolve } from "@ucdjs/path-utils";
import { createUCDStore } from "./store";

export interface NodeUCDStoreOptions<BridgeOptionsSchema extends z.ZodType>
  extends Omit<UCDStoreOptions<BridgeOptionsSchema>, "fs" | "fsOptions"> {
  basePath?: string;
}

/**
 * Creates a UCD store backed by the Node.js FileSystemBridge.
 * @template BridgeOptionsSchema extends z.ZodType
 * @param {NodeUCDStoreOptions<BridgeOptionsSchema>} [options] Store options; provide basePath to set the filesystem root.
 * @returns {Promise<UCDStore>} A ready-to-use store instance.
 * @throws {Error} If the Node.js FileSystemBridge could not be loaded.
 */
export async function createNodeUCDStore<BridgeOptionsSchema extends z.ZodType>(
  options: NodeUCDStoreOptions<BridgeOptionsSchema> = {},
): Promise<UCDStore> {
  const nodeFs = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);

  if (!nodeFs) {
    throw new Error("Node.js FileSystemBridge could not be loaded");
  }

  const { basePath, ...storeOptions } = options;
  const resolvedBasePath = basePath ? patheResolve(basePath) : patheResolve("./");

  return createUCDStore({
    ...storeOptions,
    fs: nodeFs,
    fsOptions: { basePath: resolvedBasePath },
  });
}

export interface HTTPUCDStoreOptions<BridgeOptionsSchema extends z.ZodType>
  extends Omit<UCDStoreOptions<BridgeOptionsSchema>, "fs" | "fsOptions"> {
  bridgeBaseUrl?: string;
}

/**
 * Creates a UCD store backed by the HTTP FileSystemBridge.
 * @template BridgeOptionsSchema extends z.ZodType
 * @param {HTTPUCDStoreOptions<BridgeOptionsSchema>} [options] Store options; provide baseUrl to override the default.
 * @returns {Promise<UCDStore>} A ready-to-use store instance.
 * @throws {Error} If the HTTP FileSystemBridge could not be loaded.
 */
export async function createHTTPUCDStore<BridgeOptionsSchema extends z.ZodType>(
  options: HTTPUCDStoreOptions<BridgeOptionsSchema> = {},
): Promise<UCDStore> {
  const httpFsBridge = await import("@ucdjs/fs-bridge/bridges/http").then((m) => m.default);

  if (!httpFsBridge) {
    throw new Error("HTTP FileSystemBridge could not be loaded");
  }

  const { bridgeBaseUrl, ...storeOptions } = options;
  const resolvedBridgeBaseUrl = bridgeBaseUrl ?? UCDJS_STORE_BASE_URL;

  return createUCDStore({
    ...storeOptions,
    fs: httpFsBridge,
    fsOptions: {
      baseUrl: resolvedBridgeBaseUrl,
    },
  });
}
