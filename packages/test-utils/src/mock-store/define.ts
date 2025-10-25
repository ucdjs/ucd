import type { MockFetchFn } from "@luxass/msw-utils";
import type { DefaultBodyType, HttpResponseResolver, PathParams } from "msw";
import type { paths } from "../.generated/api";

export type TypedResponseResolver<
  Params extends PathParams<keyof Params> = PathParams,
  Response extends DefaultBodyType = DefaultBodyType,
> = HttpResponseResolver<Params, DefaultBodyType, Response>;

type EndpointWithGet = {
  [K in keyof paths]: paths[K] extends { get: any } ? K : never;
}[keyof paths];

interface ContentTypeToType {
  "application/json": any;
  "text/plain": string;
  "application/octet-stream": Blob | File | ArrayBuffer | Uint8Array;
}

type InferContentTypes<Content> = Content extends Record<string, any>
  ? {
      [K in keyof Content]: K extends keyof ContentTypeToType
        ? Content[K] extends ContentTypeToType[K]
          ? Content[K]
          : ContentTypeToType[K]
        : Content[K];
    }[keyof Content]
  : never;

type InferResponsesByEndpoint<Endpoint extends EndpointWithGet>
  = paths[Endpoint]["get"]["responses"] extends infer Responses
    ? {
        [StatusCode in keyof Responses]: Responses[StatusCode] extends { content: infer Content }
          ? InferContentTypes<Content>
          : never;
      }[keyof Responses]
    : never;

type ExtractPathParams<Path extends string> = Path extends `${infer _Start}/{${infer Param}}${infer Rest}`
  ? PathParams<Param> & ExtractPathParams<Rest>
  // eslint-disable-next-line ts/no-empty-object-type
  : {};

interface MockRouteHandlerContext<Endpoint extends EndpointWithGet> {
  url: string;
  providedResponse: InferResponsesByEndpoint<Endpoint> | TypedResponseResolver<ExtractPathParams<Endpoint>, InferResponsesByEndpoint<Endpoint>> | true;
  mockFetch: MockFetchFn;
  versions: string[];
  shouldUseDefaultValue: boolean;
}

export interface RouteHandlerDefinition<Endpoint extends EndpointWithGet> {
  endpoint: Endpoint;
  setup: (context: MockRouteHandlerContext<Endpoint>) => void;
}

export function defineMockRouteHandler<Path extends EndpointWithGet>(
  definition: RouteHandlerDefinition<Path>,
): RouteHandlerDefinition<Path> {
  return definition;
}

export type InferEndpointConfig<
  Routes extends readonly RouteHandlerDefinition<any>[],
> = {
  [K in Routes[number]["endpoint"]]: Extract<Routes[number], {
    endpoint: K;
  }> extends RouteHandlerDefinition<infer E>
    ? InferResponsesByEndpoint<E> | TypedResponseResolver<ExtractPathParams<E>, InferResponsesByEndpoint<E>> | true
    : never;
};
