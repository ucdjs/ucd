// TODO: change this to schemas, when schemas export codegen models
import type { FileEntryList, UCDStoreManifest, UnicodeTree, UnicodeVersionList } from "@ucdjs/fetch";

import type { DefaultBodyType, HttpResponseResolver, PathParams } from "msw";
import type { EmptyObject } from "./types";

import { fileTreeMockHandler } from "./store-handlers/file-tree.mock-handler";
import { filesMockHandler, filesStoreMockHandler } from "./store-handlers/files.mock-handler";
import { versionsMockHandler } from "./store-handlers/versions.mock-handler";

type FileEndpointResponse = ArrayBuffer | Uint8Array | string | Blob | File | FileEntryList;
type TypedResponseResolver<
  Params extends PathParams<keyof Params> = PathParams,
  Response extends DefaultBodyType = DefaultBodyType,
> = HttpResponseResolver<Params, DefaultBodyType, Response>;

interface StoreEndpointConfig {
  "/api/v1/versions": true | UnicodeVersionList | TypedResponseResolver<EmptyObject, UnicodeVersionList>;
  "/api/v1/versions/:version/file-tree": true | UnicodeTree | TypedResponseResolver<{
    version: string;
  }, UnicodeTree>;
  "/api/v1/files/.ucd-store.json": (true | UCDStoreManifest) | TypedResponseResolver<EmptyObject, UCDStoreManifest>;
  "/api/v1/files/:wildcard": (true | FileEndpointResponse) | TypedResponseResolver<{
    wildcard: string;
  }, FileEndpointResponse>;
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
  responses?: Partial<StoreEndpointConfig>;

  /**
   * The versions to use for placeholders
   * @default ["16.0.0","15.1.0","15.0.0"]
   */
  versions?: string[];
}

const DEFAULT_RESPONSES = {
  "/api/v1/versions": true,
  "/api/v1/versions/:version/file-tree": true,
  "/api/v1/files/.ucd-store.json": true,
  "/api/v1/files/:wildcard": true,
} satisfies StoreEndpointConfig;

export function setupMockStore(config: MockStoreConfig) {
  const { baseUrl, responses, versions = ["16.0.0", "15.1.0", "15.0.0"] } = config;

  const mergedResponses = {
    ...DEFAULT_RESPONSES,
    ...responses,
  };

  function isResponseEnabled(path: StoreEndpoints): boolean {
    return mergedResponses != null && path in mergedResponses && mergedResponses[path] !== void 0;
  }

  if (isResponseEnabled("/api/v1/versions")) {
    versionsMockHandler({
      baseUrl,
      response: mergedResponses["/api/v1/versions"],
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/versions/:version/file-tree")) {
    fileTreeMockHandler({
      baseUrl,
      response: mergedResponses["/api/v1/versions/:version/file-tree"],
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/:wildcard")) {
    filesMockHandler({
      baseUrl,
      response: mergedResponses["/api/v1/files/:wildcard"],
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/.ucd-store.json")) {
    filesStoreMockHandler({
      baseUrl,
      response: mergedResponses["/api/v1/files/.ucd-store.json"],
      versions,
    });
  }
}

export type { StoreEndpointConfig, StoreEndpoints };
