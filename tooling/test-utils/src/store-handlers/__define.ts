import type { HttpResponseResolver } from "msw";
import type { StoreEndpointConfig, StoreEndpoints } from "../store";
import type { HTTPMethod, NonEmptyArray } from "../types";
import { mockFetch } from "../msw";

interface Context {
  baseUrl: string;
  response: StoreEndpointConfig[StoreEndpoints];
}

type SetupFn = ({ baseUrl, response }: Context) => [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver][];

export function defineMockFetchHandler(fn: SetupFn) {
  return ({ baseUrl, response }: Context) => {
    const endpoints = fn({ baseUrl, response });
    for (const [methods, url, resolver] of endpoints) {
      mockFetch(methods, url, resolver);
    }
  };
}
