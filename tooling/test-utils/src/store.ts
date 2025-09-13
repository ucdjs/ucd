// TODO: change this to schemas, when schemas export codegen models
import type { FileEntryList, UnicodeTree, UnicodeVersionList } from "@ucdjs/fetch";
import type { UCDStoreManifest } from "@ucdjs/schemas";
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

type StoreResponseOverrides = Partial<{
  [K in StoreEndpoints]: false | StoreEndpointConfig[K]
}>;
type StoreEndpoints = keyof StoreEndpointConfig;

interface MockStoreConfig {
  /**
   * The base URL for the store.
   *
   * @default "https://api.ucdjs.dev"
   */
  baseUrl?: string;

  /**
   * The responses to mock for the store endpoints.
   *
   * NOTE:
   * If the value provided is `true`, then a default handler will be used.
   * If the value is `false`, then no handler will be used.
   * If the value provided is a specific response, then that response will be used.
   */
  responses?: StoreResponseOverrides;

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
} as const satisfies StoreResponseOverrides;

export function setupMockStore(config?: MockStoreConfig) {
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
    versionsMockHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/versions"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/versions/:version/file-tree")) {
    fileTreeMockHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/versions/:version/file-tree"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/:wildcard")) {
    filesMockHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/:wildcard"),
      versions,
    });
  }

  if (isResponseEnabled("/api/v1/files/.ucd-store.json")) {
    filesStoreMockHandler({
      baseUrl: normalizedBaseUrl,
      response: getResponse("/api/v1/files/.ucd-store.json"),
      versions,
    });
  }
}

export type { StoreEndpointConfig, StoreEndpoints };
