import type z from "zod";
import type { UCDStore, UCDStoreOptions } from "./types";
import { UCDJS_STORE_BASE_URL } from "@ucdjs/env";
import { patheResolve } from "@ucdjs/path-utils";
import { createUCDStore } from "./store";

export interface NodeUCDStoreOptions<BackendOptionsSchema extends z.ZodType>
  extends Omit<UCDStoreOptions<BackendOptionsSchema>, "fs" | "fsOptions"> {
  basePath?: string;
}

/**
 * Creates a UCD store backed by the Node.js filesystem backend.
 * @template BackendOptionsSchema extends z.ZodType
 * @param {NodeUCDStoreOptions<BackendOptionsSchema>} [options] Store options; provide basePath to set the filesystem root.
 * @returns {Promise<UCDStore>} A ready-to-use store instance.
 * @throws {Error} If the Node.js filesystem backend could not be loaded.
 */
export async function createNodeUCDStore<BackendOptionsSchema extends z.ZodType>(
  options: NodeUCDStoreOptions<BackendOptionsSchema> = {},
): Promise<UCDStore> {
  const nodeFs = await import("@ucdjs/fs-backend/backends/node").then((m) => m.default);

  if (!nodeFs) {
    throw new Error("Node.js filesystem backend could not be loaded");
  }

  const { basePath, ...storeOptions } = options;
  const resolvedBasePath = basePath ? patheResolve(basePath) : patheResolve("./");

  return createUCDStore({
    ...storeOptions,
    fs: nodeFs,
    fsOptions: { basePath: resolvedBasePath },
  });
}

export interface HTTPUCDStoreOptions<BackendOptionsSchema extends z.ZodType>
  extends Omit<UCDStoreOptions<BackendOptionsSchema>, "fs" | "fsOptions"> {
  backendBaseUrl?: string;
}

/**
 * Creates a UCD store backed by the HTTP filesystem backend.
 * @template BackendOptionsSchema extends z.ZodType
 * @param {HTTPUCDStoreOptions<BridgeOptionsSchema>} [options] Store options; provide baseUrl to override the default.
 * @returns {Promise<UCDStore>} A ready-to-use store instance.
 * @throws {Error} If the HTTP filesystem backend could not be loaded.
 */
export async function createHTTPUCDStore<BackendOptionsSchema extends z.ZodType>(
  options: HTTPUCDStoreOptions<BackendOptionsSchema> = {},
): Promise<UCDStore> {
  const httpFsBackend = await import("@ucdjs/fs-backend/backends/http").then((m) => m.default);

  if (!httpFsBackend) {
    throw new Error("HTTP filesystem backend could not be loaded");
  }

  const { backendBaseUrl, ...storeOptions } = options;
  const resolvedBackendBaseUrl = backendBaseUrl ?? UCDJS_STORE_BASE_URL;

  return createUCDStore({
    ...storeOptions,
    fs: httpFsBackend,
    fsOptions: {
      baseUrl: resolvedBackendBaseUrl,
    },
  });
}
