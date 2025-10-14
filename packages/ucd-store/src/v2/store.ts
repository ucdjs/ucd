// const store = await createUCDStore({
//   fs: nodeFS,
//   basePath: "./data",
//   baseUrl: "https://api.ucdjs.dev",
//   versions: ["16.0.0"],
// });

import type { PathFilter } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreContext, UCDStoreMethods, UCDStoreOperations, UCDStoreOptions, UCDStoreV2 } from "./types";
import { createDebugger, createPathFilter } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import defu from "defu";
import { join } from "pathe";
import { readManifest } from "./manifest";

const debug = createDebugger("ucdjs:ucd-store:v2");

export async function createUCDStore(options: UCDStoreOptions): Promise<UCDStoreV2> {
  debug?.("Creating UCD Store with options", options);
  const { baseUrl, globalFilters, fs, basePath, versions } = defu(options, {
    baseUrl: UCDJS_API_BASE_URL,
    globalFilters: {},
    basePath: "",
    versions: [],
  });

  const filter = createPathFilter(globalFilters);
  const manifestPath = join(basePath, ".ucd-store.json");

  // check for existing manifest
  const manifestExists = await fs.exists(manifestPath);
  let storeVersions = versions;
  let client: UCDClient | null = options.client ?? null;

  if (manifestExists) {
    // Offline mode - read from manifest
    const manifest = await readManifest(fs, manifestPath);
    storeVersions = Object.keys(manifest);
  } else {
    // bootstrap mode (utilize the api client)
    if (client === null) {
      client = await createUCDClient(baseUrl);
    }

    // validate versions, create manifest, etc.
    await bootstrap({ client, fs, basePath, versions: storeVersions });
  }

  const storeContext = {
    get client(): UCDClient {
      if (client == null) {
        throw new Error("UCD Client is not initialized.");
      }

      return client;
    },
    get filter(): PathFilter {
      return filter;
    },
    get fs(): FileSystemBridge {
      return fs;
    },
    get basePath(): string {
      return basePath;
    },
    get versions(): string[] {
      return storeVersions ?? [];
    },
    get manifestPath(): string {
      return manifestPath;
    },
  } satisfies UCDStoreContext;

  return {
    ...storeContext,
    ...createUCDStoreMethods(storeContext),
    ...createUCDStoreOperations(storeContext),
  };
}

function createUCDStoreMethods(context: UCDStoreContext): UCDStoreMethods {
  return {

  };
}

function createUCDStoreOperations(context: UCDStoreContext): UCDStoreOperations {
  return {

  };
}
