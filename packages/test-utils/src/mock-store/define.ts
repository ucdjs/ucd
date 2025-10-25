import type { EndpointWithGet, RouteHandlerDefinition } from "./types";

export function defineMockRouteHandler<Path extends EndpointWithGet>(
  definition: RouteHandlerDefinition<Path>,
): RouteHandlerDefinition<Path> {
  return definition;
}
