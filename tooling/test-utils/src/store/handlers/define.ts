import type { MockFetchMethod, NonEmptyArray } from "#internal/test-utils/msw";
import type { HttpResponseResolver } from "msw";
import type { StoreEndpointConfig, StoreEndpoints } from "../store";
import { mockFetch } from "#internal/test-utils/msw";

interface Context {
  baseUrl: string;
  response: StoreEndpointConfig[StoreEndpoints];
}

type SetupFn = ({ baseUrl, response }: Context) => [NonEmptyArray<MockFetchMethod> | MockFetchMethod, string, HttpResponseResolver][];

export function defineMockFetchHandler(fn: SetupFn) {
  return ({ baseUrl, response }: Context) => {
    const endpoints = fn({ baseUrl, response });
    for (const [methods, url, resolver] of endpoints) {
      mockFetch(methods, url, resolver);
    }
  };
}
