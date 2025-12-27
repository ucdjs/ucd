import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { createDebugger, tryOr } from "@ucdjs-internal/shared";
import { readLockfile } from "@ucdjs/lockfile";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:verify");

export interface VerifyOptions {
  /**
   * UCD Client instance to use for API requests.
   */
  client: UCDClient;

  /**
   * Path to the lockfile to verify against.
   */
  lockfilePath: string;

  /**
   * File system bridge for file operations.
   */
  fs: FileSystemBridge;
}

export interface VerifyResult {
  /**
   * Whether the lockfile is valid (all versions present in the API).
   */
  valid: boolean;

  /**
   * Versions listed in the lockfile.
   */
  lockfileVersions: string[];

  /**
   * Versions available from the API.
   */
  availableVersions: string[];

  /**
   * Versions present in the lockfile but missing from the API.
   */
  missingVersions: string[];

  /**
   * Versions available in the API but not listed in the lockfile.
   */
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
  const { client, lockfilePath, fs } = options;

  debug?.("Starting lockfile verification");

  const lockfile = await tryOr({
    try: () => readLockfile(fs, lockfilePath),
    err: (err) => {
      throw new UCDStoreGenericError(`Failed to read lockfile at ${lockfilePath}: ${(err as any).message}`);
    },
  });

  const lockfileVersions = Object.keys(lockfile.versions || {});
  debug?.(`Found ${lockfileVersions.length} versions in lockfile:`, lockfileVersions);

  const apiResponseResult = await client.versions.list();

  if (apiResponseResult.error) {
    throw new UCDStoreGenericError(
      `Failed to fetch Unicode versions during verification: ${apiResponseResult.error.message}${
        apiResponseResult.error.status ? ` (status ${apiResponseResult.error.status})` : ""
      }`,
    );
  }

  if (!apiResponseResult.data) {
    throw new UCDStoreGenericError("Failed to fetch Unicode versions during verification: no data returned");
  }

  // The list of available versions from the API
  const availableVersions = apiResponseResult.data.map(({ version }) => version);
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
