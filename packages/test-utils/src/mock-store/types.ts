import type { MockFetchFn } from "@luxass/msw-utils";
import type { UnicodeTreeNode } from "@ucdjs/schemas";
import type { AsyncResponseResolverReturnType, DefaultBodyType, HttpResponseResolver, PathParams } from "msw";
import type { paths } from "../.generated/api";
import type { MOCK_ROUTES } from "./handlers";
import type { kConfiguredResponse } from "./helpers";

interface ContentTypeToType {
  "application/json": any;
  "text/plain": string;
  "application/octet-stream": Blob | File | ArrayBuffer | Uint8Array;
}

export type EndpointWithGet = {
  [K in keyof paths]: paths[K] extends { get: any } ? K : never;
}[keyof paths];

export type TypedResponseResolver<
  Params extends PathParams<string> = PathParams,
  Response extends DefaultBodyType = DefaultBodyType,
> = HttpResponseResolver<Params, DefaultBodyType, Response>;

type ExtractPathParams<Path extends string> = Path extends `${infer _Start}/{${infer Param}}${infer Rest}`
  ? PathParams<Param> & ExtractPathParams<Rest>
  // eslint-disable-next-line ts/no-empty-object-type
  : {};

export type InferContentTypes<Content> = Content extends Record<string, any>
  ? {
      [K in keyof Content]: K extends keyof ContentTypeToType
        ? Content[K] extends ContentTypeToType[K]
          ? Content[K]
          : ContentTypeToType[K]
        : Content[K];
    }[keyof Content]
  : never;

export type InferResponsesByEndpoint<Endpoint extends EndpointWithGet>
  = paths[Endpoint]["get"]["responses"] extends infer Responses
    ? {
        [StatusCode in keyof Responses]: Responses[StatusCode] extends { content: infer Content }
          ? InferContentTypes<Content>
          : never;
      }[keyof Responses]
    : never;

export type InferEndpointConfig<
  Routes extends readonly RouteHandlerDefinition<any>[],
> = {
  [K in Routes[number]["endpoint"]]: Extract<Routes[number], {
    endpoint: K;
  }> extends RouteHandlerDefinition<infer E>
    ? InferResponsesByEndpoint<E> | ConfiguredResponse<InferResponsesByEndpoint<E>> | TypedResponseResolver<ExtractPathParams<E>, InferResponsesByEndpoint<E>> | true
    : never;
};

interface MockRouteHandlerContext<Endpoint extends EndpointWithGet> {
  url: string;
  providedResponse: InferResponsesByEndpoint<Endpoint> | TypedResponseResolver<ExtractPathParams<Endpoint>, InferResponsesByEndpoint<Endpoint>> | true;
  mockFetch: MockFetchFn;
  versions: string[];
  shouldUseDefaultValue: boolean;
  files: MockStoreFiles;
}

export interface RouteHandlerDefinition<Endpoint extends EndpointWithGet> {
  endpoint: Endpoint;
  setup: (context: MockRouteHandlerContext<Endpoint>) => void;
}

type DerivedEndpointConfig = InferEndpointConfig<typeof MOCK_ROUTES>;

type DerivedResponses = Partial<{
  [K in keyof DerivedEndpointConfig]: false | DerivedEndpointConfig[K];
}>;

export type StoreVersionFileKey = "16.0.0" | "17.0.0";
export type StoreFileKeyWildcard = "*" | "root";

type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

type MockStoreKey = StoreVersionFileKey | StoreFileKeyWildcard | (string & {});

export type MockStoreNode
  = | (Omit<UnicodeTreeNode, "type" | "path"> & { type: "file"; path?: string; _content?: string })
    | (Omit<UnicodeTreeNode, "type" | "path"> & { type: "directory"; path?: string; _content?: string; children: MockStoreNode[] });

export type MockStoreNodeWithPath
  = | (Omit<UnicodeTreeNode, "type"> & { type: "file"; _content?: string })
    | (Omit<UnicodeTreeNode, "type"> & { type: "directory"; _content?: string; children: MockStoreNodeWithPath[] });

export type MockStoreFiles = PartialRecord<MockStoreKey, MockStoreNode[]>;

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
   *
   * By default, all endpoints are disabled.
   */
  responses?: DerivedResponses;

  /**
   * The files to mock for the store endpoint.
   *
   * The keys are the version to mock the files for.
   *
   * It will be used by the following endpoints:
   * - `/api/v1/versions/{version}/file-tree`
   * - `/.well-known/ucd-store/{version}.json`
   *
   * A special key of `*` can be used to mock all versions.
   */
  files?: MockStoreFiles;

  /**
   * The versions to use for placeholders
   * @default ["16.0.0","15.1.0","15.0.0"]
   */
  versions?: string[];

  /**
   * Custom mock fetch handlers to register
   *
   * @example
   * ```ts
   * customResponses: [
   *   ["GET", "/custom-endpoint", () => HttpResponse.json({ custom: true })],
   *   [["POST", "PUT"], "/another-endpoint", ({ params }) => {
   *     const id = params.id;
   *     return HttpResponse.json({ id });
   *   }],
   * ]
   * ```
   */
  customResponses?: MockFetchParamTupleList[0][];

  /**
   * Callback invoked on each request to the mock store
   *
   * NOTE:
   * This is not invoked for `customResponses` handlers.
   *
   * @example
   * ```ts
   * onRequest: ({ path, method, params, url }) => {
   *   console.log(`Request to ${method} ${path} with params`, params);
   * }
   * ```
   */
  onRequest?: OnRequestCallback;
}

export type MockFetchParamTupleList = MockFetchFn extends {
  (...a: infer A): any;
  (...a: infer B): any;
  (...a: infer C): any;
} ? [A, B, C]
  : never;

export type MockFetchType = MockFetchParamTupleList[0][];

export interface ConfiguredResponseConfig<Response> {
  /**
   * The actual response to be returned
   */
  response: Response;

  /**
   *  Optional latency in milliseconds or "random" for a random delay between 100-999ms
   */
  latency?: number | "random";

  /**
   * Optional custom headers to add to the response
   */
  headers?: Record<string, string>;

  /**
   * Optional hook that runs before the resolver is called
   */
  before?: OnBeforeMockFetchCallback;

  /**
   * Optional hook that runs after the resolver returns
   */
  after?: OnAfterMockFetchCallback;
}

export type ConfiguredResponse<Response> = Response & {
  [kConfiguredResponse]: {
    latency?: ConfiguredResponseConfig<Response>["latency"];
    headers?: ConfiguredResponseConfig<Response>["headers"];
    before?: ConfiguredResponseConfig<Response>["before"];
    after?: ConfiguredResponseConfig<Response>["after"];
  };
};

export interface WrapMockFetchCallbackPayload {
  path: string;
  method: string;
  params: Record<string, any>;
  url: string;
}

export interface WrapMockFetchCallbackPayloadWithResponse extends WrapMockFetchCallbackPayload {
  response: AsyncResponseResolverReturnType<DefaultBodyType>;
}

export type OnRequestCallback = (payload: WrapMockFetchCallbackPayload) => void;
export type OnBeforeMockFetchCallback = (payload: WrapMockFetchCallbackPayload) => void | Promise<void>;
export type OnAfterMockFetchCallback = (payload: WrapMockFetchCallbackPayloadWithResponse) => void | Promise<void>;
