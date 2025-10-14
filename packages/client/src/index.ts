import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { FilesResource } from "./resources/files";
import type { VersionsResource } from "./resources/versions";
import { discoverEndpointsFromConfig } from "./core/well-known";
import { createFilesResource } from "./resources/files";
import { createVersionsResource } from "./resources/versions";

export interface UCDClient {
  /**
   * Access file-related endpoints
   */
  files: FilesResource;

  /**
   * Access version-related endpoints
   */
  versions: VersionsResource;
}
/**
 * Creates a UCD client that automatically discovers endpoint paths
 * via the well-known configuration endpoint
 *
 * @param {string} baseUrl - The base URL of the UCD API server (e.g., "https://api.ucdjs.dev")
 * @returns {Promise<UCDClient>} A configured UCD client with resource namespaces
 *
 * @example
 * ```ts
 * const client = await createUCDClient('https://api.ucdjs.dev');
 *
 * // List all versions
 * const versions = await client.versions.list();
 *
 * // Get a file
 * const file = await client.files.get('16.0.0/ucd/UnicodeData.txt');
 * ```
 */
export async function createUCDClient(baseUrl: string, endpointConfig?: UCDWellKnownConfig): Promise<UCDClient> {
  const config = endpointConfig ?? await discoverEndpointsFromConfig(baseUrl);

  // create resource instances with discovered paths
  const files = createFilesResource({
    baseUrl,
    filesPath: config.endpoints.files,
    manifestPath: config.endpoints.manifest,
  });

  const versions = createVersionsResource({
    baseUrl,
    versionsPath: config.endpoints.versions,
  });

  return {
    files,
    versions,
  };
}

export * from "./core/guards";
export { discoverEndpointsFromConfig };
