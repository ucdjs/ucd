import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { UCDStoreGenericError } from "../errors";
import { readManifest } from "../manifest";

export interface VerifyOptions {
  client: UCDClient;
  manifestPath: string;
  fs: FileSystemBridge;
}

export interface VerifyResult {
  valid: boolean;
  manifestVersions: string[];
  availableVersions: string[];
  missingVersions: string[];
  extraVersions: string[];
}

/**
 * Verifies that versions in the manifest are available in the API.
 * This checks the health of the store by comparing manifest versions
 * against the current list of available versions from the API.
 *
 * @param {VerifyOptions} options - Verification options or internal store context
 * @returns {Promise<VerifyResult>} Verification result with comparison details
 * @throws {UCDStoreGenericError} If API fetch fails
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const { client, manifestPath, fs } = options;

  const manifest = await readManifest(fs, manifestPath);
  const manifestVersions = Object.keys(manifest);

  const result = await client.versions.list();

  if (result.error) {
    throw new UCDStoreGenericError(
      `Failed to fetch Unicode versions during verification: ${result.error.message}${
        result.error.status ? ` (status ${result.error.status})` : ""
      }`,
    );
  }

  if (!result.data) {
    throw new UCDStoreGenericError("Failed to fetch Unicode versions during verification: no data returned");
  }

  const availableVersions = result.data.map(({ version }) => version);

  const missingVersions = manifestVersions.filter((v) => !availableVersions.includes(v));
  const extraVersions = availableVersions.filter((v) => !manifestVersions.includes(v));

  return {
    valid: missingVersions.length === 0,
    manifestVersions,
    availableVersions,
    missingVersions,
    extraVersions,
  };
}
