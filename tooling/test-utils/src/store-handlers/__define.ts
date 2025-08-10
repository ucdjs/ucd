import type { HttpResponseResolver } from "msw";
import type { StoreEndpointConfig, StoreEndpoints } from "../store";
import type { HTTPMethod, NonEmptyArray } from "../types";
import { mockFetch } from "../msw";

interface Context<Key extends StoreEndpoints> {
  baseUrl: string;
  response: StoreEndpointConfig[Key];
}

type SetupFn<Key extends StoreEndpoints> = ({ baseUrl, response }: Context<Key>) => [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver][];

export function defineMockFetchHandler<Key extends StoreEndpoints>(key: Key, fn: SetupFn<Key>) {
  return ({ baseUrl, response }: Context<Key>) => {
    const endpoints = fn({ baseUrl, response });
    for (const [methods, url, resolver] of endpoints) {
      mockFetch(methods, url, resolver);
    }
  };
}
