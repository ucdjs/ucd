import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreGenericError } from "../errors";
import { writeManifest } from "../manifest";

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

  const missingVersions = versions.filter((v) => !availableVersions.includes(v));
  if (missingVersions.length > 0) {
    throw new UCDStoreGenericError(
      `Some requested versions are not available in the API: ${missingVersions.join(", ")}`,
    );
  }

  const basePathExists = await fs.exists(basePath);
  if (!basePathExists) {
    assertCapability(fs, "mkdir");
    await fs.mkdir(basePath);
  }

  await writeManifest(fs, manifestPath, versions);
}
