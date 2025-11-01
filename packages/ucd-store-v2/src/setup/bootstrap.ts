import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { createDebugger } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { writeManifest } from "../core/manifest";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:bootstrap");

export interface BootstrapOptions {
  client: UCDClient;
  fs: FileSystemBridge;
  basePath: string;
  versions: string[];
  manifestPath: string;
}

/**
 * Bootstraps a new store by validating versions against the API
 * and creating the initial manifest.
 *
 * @param {BootstrapOptions} options - Bootstrap configuration options
 * @throws {UCDStoreGenericError} If API fetch fails or versions are invalid
 */
export async function bootstrap(options: BootstrapOptions): Promise<void> {
  const { client, fs, basePath, versions, manifestPath } = options;

  debug?.("Starting bootstrap for versions:", versions);

  const result = await client.versions.list();

  if (result.error) {
    throw new UCDStoreGenericError(
      `Failed to fetch Unicode versions: ${result.error.message}${
        result.error.status ? ` (status ${result.error.status})` : ""
      }`,
    );
  }

  if (!result.data) {
    throw new UCDStoreGenericError("Failed to fetch Unicode versions: no data returned");
  }

  const availableVersions = result.data.map(({ version }) => version);
  debug?.(`Fetched ${availableVersions.length} available versions from API`);

  const missingVersions = versions.filter((v) => !availableVersions.includes(v));
  if (missingVersions.length > 0) {
    debug?.("✗ Validation failed - missing versions:", missingVersions);
    throw new UCDStoreGenericError(
      `Some requested versions are not available in the API: ${missingVersions.join(", ")}`,
    );
  }

  debug?.("✓ All requested versions are available");

  const basePathExists = await fs.exists(basePath);
  if (!basePathExists) {
    debug?.(`Creating base directory: ${basePath}`);
    assertCapability(fs, "mkdir");
    await fs.mkdir(basePath);
  } else {
    debug?.("Base directory already exists");
  }

  debug?.(`Writing manifest to: ${manifestPath}`);
  await writeManifest(fs, manifestPath, versions);

  debug?.("✓ Bootstrap completed successfully");
}
