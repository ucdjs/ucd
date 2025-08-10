// TODO: change this to schemas, when schemas export codegen models
import type { FileEntryList, UnicodeTree, UnicodeVersionList } from "@ucdjs/fetch";

import fileTreeHandler from "./store-handlers/file-tree";
import filesHandler from "./store-handlers/files";
import versionsHandler from "./store-handlers/versions";

type FileEndpointResponse = ArrayBuffer | Uint8Array | string | Blob | File | FileEntryList;

interface StoreEndpointConfig {
  "/api/v1/versions": boolean | UnicodeVersionList;
  "/api/v1/versions/:version/file-tree": boolean | UnicodeTree;
  "/api/v1/files/:wildcard": boolean | FileEndpointResponse;
}

type StoreEndpoints = keyof StoreEndpointConfig;

interface MockStoreConfig {
  /**
   * The base URL for the store.
   *
   * @default "https://api.ucdjs.dev"
   */
  baseUrl: string;

  /**
   * The responses to mock for the store endpoints.
   *
   * NOTE:
   * If the value provided is `true`, then a default handler will be used.
   * If the value is `false`, then no handler will be used.
   * If the value provided is a specific response, then that response will be used.
   */
  responses: StoreEndpointConfig;

  /**
   * The versions to use for placeholders
   * @default ["16.0.0","15.1.0","15.0.0"]
   */
  versions?: string[];
}

export function setupMockStore(config: MockStoreConfig) {
  const { baseUrl, responses } = config;

  function isResponseEnabled(path: StoreEndpoints): boolean {
    return path in responses && responses[path] !== false;
  }

  if (isResponseEnabled("/api/v1/versions")) {
    versionsHandler({
      baseUrl,
      response: responses["/api/v1/versions"],
    });
  }

  if (isResponseEnabled("/api/v1/versions/:version/file-tree")) {
    fileTreeHandler({
      baseUrl,
      response: responses["/api/v1/versions/:version/file-tree"],
    });
  }

  if (isResponseEnabled("/api/v1/files/:wildcard")) {
    filesHandler({
      baseUrl,
      response: responses["/api/v1/files/:wildcard"],
    });
  }
}

export type { StoreEndpointConfig, StoreEndpoints };
