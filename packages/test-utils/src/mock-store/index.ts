import type { MockStoreConfig, StoreEndpointConfig, StoreEndpoints, StoreResponseOverrides } from "./types";
import { createMockFetch } from "@luxass/msw-utils";
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
    mswServer: providedMswServer,
  } = config || {};

  const mswServer = providedMswServer ?? globalThis.__ucd_msw_server;

  if (!mswServer) {
    throw new Error(
      "No MSW server available. Either:\n"
      + "1. Import '@ucdjs/test-utils/msw/vitest-setup' in your vitest setupFiles\n"
      + "2. Pass a server: setupMockStore({ mswServer: yourServer })",
    );
  }

  const mockFetch = createMockFetch({ mswServer });
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

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
      mockFetch,
    });
  }

  if (isResponseEnabled("/api/v1/versions/:version/file-tree")) {
    setupFileTreeHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/versions/:version/file-tree"),
      versions,
      mockFetch,
    });
  }

  if (isResponseEnabled("/api/v1/files/:wildcard")) {
    setupFilesHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/:wildcard"),
      versions,
      mockFetch,
    });
  }

  if (isResponseEnabled("/api/v1/files/.ucd-store.json")) {
    setupStoreManifestHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/.ucd-store.json"),
      versions,
      mockFetch,
    });
  }
}

export type { MockStoreConfig, StoreEndpointConfig, StoreEndpoints } from "./types";
