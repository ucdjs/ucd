import type { OpenAPITag } from "./src/openapi";

declare module "@asteasolutions/zod-to-openapi" {
  // Augment the AsteaSolutions RouteConfig to make tags typesafe.
  interface RouteConfig {
    tags?: OpenAPITag[];
  }
}
