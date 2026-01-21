import type { UCDWellKnownConfig } from "@ucdjs/schemas";
import type { ConfigResource } from "./resources/config";
import type { FilesResource } from "./resources/files";
import type { ManifestResource } from "./resources/manifest";
import type { VersionsResource } from "./resources/versions";
import { discoverEndpointsFromConfig } from "@ucdjs-internal/shared";
import { createConfigResource } from "./resources/config";
import { createFilesResource } from "./resources/files";
import { createManifestResource } from "./resources/manifest";
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

  /**
   * Access configuration endpoints
   */
  config: ConfigResource;

  /**
   * Access manifest endpoints
   */
  manifest: ManifestResource;
}

function createResources(baseUrl: string, endpointConfig: UCDWellKnownConfig["endpoints"]): UCDClient {
  const files = createFilesResource({
    baseUrl,
    endpoints: endpointConfig,
  });

  const versions = createVersionsResource({
    baseUrl,
    endpoints: endpointConfig,
  });

  const config = createConfigResource({
    baseUrl,
  });

  const manifest = createManifestResource({
    baseUrl,
  });

  return {
    files,
    versions,
    config,
    manifest,
  };
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
 *
 * // Get configuration
 * const config = await client.config.get();
 *
 * // Get manifest for a version
 * const manifest = await client.manifest.get('16.0.0');
 * ```
 */
export async function createUCDClient(baseUrl: string): Promise<UCDClient> {
  const config = await discoverEndpointsFromConfig(baseUrl);

  return createResources(baseUrl, config.endpoints);
}

/**
 * Creates a UCD client with a synchronous configuration
 *
 * @param {string} baseUrl - The base URL of the UCD API server (e.g., "https://api.ucdjs.dev")
 * @param {UCDWellKnownConfig} endpointConfig - The well-known configuration for endpoints
 * @returns {UCDClient} A configured UCD client with resource namespaces
 *
 * @example
 * ```ts
 * const client = createUCDClientWithConfig('https://api.ucdjs.dev', {
 *   version: '1.0',
 *   endpoints: {
 *     files: '/files',
 *     manifest: '/files/.ucd-store.json',
 *     versions: '/versions',
 *   },
 * });
 *
 * // List all versions
 * const versions = await client.versions.list();
 *
 * // Get a file
 * const file = await client.files.get('16.0.0/ucd/UnicodeData.txt');
 * ```
 */
export function createUCDClientWithConfig(baseUrl: string, endpointConfig: UCDWellKnownConfig): UCDClient {
  return createResources(baseUrl, endpointConfig.endpoints);
}
