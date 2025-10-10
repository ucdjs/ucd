import type { JSONSchemaMeta } from "zod/v4/core";
import * as z from "zod";

// // Store original register method and patch it IMMEDIATELY before anything else
// const originalRegister = z.ZodType.prototype.register;

// // Override register to be idempotent - only register if ID doesn't exist
// z.ZodType.prototype.register = function(registry: any, metadata: any) {
//   if (metadata?.id && registry.has(metadata.id)) {
//     // Already registered, return this
//     return this;
//   }
//   return originalRegister.call(this, registry, metadata);
// };

/**
 * Custom registry for UCD schemas with strongly-typed metadata.
 * This registry is used to manage schema metadata for OpenAPI generation
 * without polluting the global registry.
 */
export const ucdRegistry = z.registry<JSONSchemaMeta & {
  examples?: z.$output[];

  /**
   * @deprecated - Use `examples` instead.
   * Use of `example` is discouraged, and later versions of OpenAPI specification may remove it.
   */
  example?: z.$output;
}>();
