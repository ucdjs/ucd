import type { MockStoreConfig, StoreEndpointConfig, StoreEndpoints, StoreResponseOverrides } from "./types";
import { setupFileTreeHandler } from "./handlers/file-tree";
import { setupFilesHandler, setupStoreManifestHandler } from "./handlers/files";
import { setupVersionsHandler } from "./handlers/versions";

const DEFAULT_RESPONSES = {
  "/api/v1/versions": true,
  "/api/v1/versions/:version/file-tree": true,
  "/api/v1/files/.ucd-store.json": true,
  "/api/v1/files/:wildcard": true,
} as const satisfies StoreResponseOverrides;

export function setupMockStore(config?: MockStoreConfig): void {
  const {
    baseUrl = "https://api.ucdjs.dev",
    responses,
    versions = ["16.0.0", "15.1.0", "15.0.0"],
  } = config || {};

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  const mergedResponses = {
    ...DEFAULT_RESPONSES,
    ...responses,
  };

  function isResponseEnabled(path: StoreEndpoints): boolean {
    return path in mergedResponses && mergedResponses[path] !== false;
  }

  function getResponse<K extends StoreEndpoints>(key: K): StoreEndpointConfig[K] {
    const response = mergedResponses[key];
    if (response === false) {
      throw new Error(`Response for ${key} is disabled`);
    }

    return response as StoreEndpointConfig[K];
  }

  if (isResponseEnabled("/api/v1/versions")) {
    setupVersionsHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/versions"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/versions/:version/file-tree")) {
    setupFileTreeHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/versions/:version/file-tree"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/:wildcard")) {
    setupFilesHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/:wildcard"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/.ucd-store.json")) {
    setupStoreManifestHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/.ucd-store.json"),
      versions,
    });
  }
}

export type { MockStoreConfig, StoreEndpointConfig, StoreEndpoints } from "./types";
