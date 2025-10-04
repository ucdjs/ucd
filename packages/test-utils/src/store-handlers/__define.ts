import type { HttpResponseResolver } from "msw";
import type { StoreEndpointConfig, StoreEndpoints } from "../store";
import type { HTTPMethod, NonEmptyArray } from "../types";
import { mockFetch } from "../msw";

interface Context<Key extends StoreEndpoints> {
  baseUrl: string;
  response: StoreEndpointConfig[Key];
  versions: string[];
}

type SetupFn<Key extends StoreEndpoints> = ({ baseUrl, response, versions }: Context<Key>) => [NonEmptyArray<HTTPMethod> | HTTPMethod, string, HttpResponseResolver<any, any, any>][];

export function defineMockFetchHandler<Key extends StoreEndpoints>(_key: Key, fn: SetupFn<Key>) {
  return ({ baseUrl, response, versions }: Context<Key>) => {
    const endpoints = fn({ baseUrl, response, versions });
    mockFetch(endpoints);
  };
}
