import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { createDebugger } from "@ucdjs-internal/shared";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:verify");

export interface VerifyOptions {
  client: UCDClient;
  lockfilePath: string;
  fs: FileSystemBridge;
  versions: string[];
}

export interface VerifyResult {
  valid: boolean;
  lockfileVersions: string[];
  availableVersions: string[];
  missingVersions: string[];
  extraVersions: string[];
}

/**
 * Verifies that versions in the lockfile are available in the API.
 * This checks the health of the store by comparing lockfile versions
 * against the current list of available versions from the API.
 *
 * @param {VerifyOptions} options - Verification options
 * @returns {Promise<VerifyResult>} Verification result with comparison details
 * @throws {UCDStoreGenericError} If API fetch fails
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const { client, lockfilePath: _lockfilePath, fs: _fs, versions } = options;

  debug?.("Starting lockfile verification");

  const lockfileVersions = versions;
  debug?.(`Found ${lockfileVersions.length} versions in lockfile:`, lockfileVersions);

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
  debug?.(`Fetched ${availableVersions.length} available versions from API`);

  const missingVersions = lockfileVersions.filter((v) => !availableVersions.includes(v));
  const extraVersions = availableVersions.filter((v) => !lockfileVersions.includes(v));

  const valid = missingVersions.length === 0;
  debug?.(
    valid ? "✓ Verification passed" : "✗ Verification failed",
    {
      missing: missingVersions.length,
      extra: extraVersions.length,
    },
  );

  debug?.("Missing versions:", missingVersions);
  debug?.("Extra versions available:", extraVersions);

  return {
    valid,
    lockfileVersions,
    availableVersions,
    missingVersions,
    extraVersions,
  };
}
