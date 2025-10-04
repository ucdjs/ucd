import type { MockFetchFn } from "@luxass/msw-utils";
import type {
  FileEntryList,
  UCDStoreManifest,
  UnicodeTree,
  UnicodeVersionList,
} from "@ucdjs/schemas";
import type {
  DefaultBodyType,
  HttpResponseResolver,
  PathParams,
} from "msw";
import type {
  SetupServerApi,
} from "msw/node";

export type FileEndpointResponse = ArrayBuffer | Uint8Array | string | Blob | File | FileEntryList;

export type TypedResponseResolver<
  Params extends PathParams<keyof Params> = PathParams,
  Response extends DefaultBodyType = DefaultBodyType,
> = HttpResponseResolver<Params, DefaultBodyType, Response>;

// eslint-disable-next-line ts/no-empty-object-type
export interface EmptyObject {}

export interface StoreEndpointConfig {
  "/api/v1/versions": true | UnicodeVersionList | TypedResponseResolver<EmptyObject, UnicodeVersionList>;
  "/api/v1/versions/:version/file-tree": true | UnicodeTree | TypedResponseResolver<{
    version: string;
  }, UnicodeTree>;
  "/api/v1/files/.ucd-store.json": (true | UCDStoreManifest) | TypedResponseResolver<EmptyObject, UCDStoreManifest>;
  "/api/v1/files/:wildcard": (true | FileEndpointResponse) | TypedResponseResolver<{
    wildcard: string;
  }, FileEndpointResponse>;
}

export type StoreEndpoints = keyof StoreEndpointConfig;

export type StoreResponseOverrides = Partial<{
  [K in StoreEndpoints]: false | StoreEndpointConfig[K]
}>;

export interface MockStoreConfig {
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

  mswServer?: SetupServerApi;
}

export interface HandlerContext<Key extends StoreEndpoints> {
  baseUrl: string;
  response: StoreEndpointConfig[Key];
  versions: string[];
  mockFetch: MockFetchFn;
}
