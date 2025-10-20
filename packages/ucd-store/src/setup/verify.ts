import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import { createDebugger } from "@ucdjs-internal/shared";
import { readManifest } from "../core/manifest";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:verify");

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

  debug?.("Starting manifest verification");

  const manifest = await readManifest(fs, manifestPath);
  const manifestVersions = Object.keys(manifest);
  debug?.(`Found ${manifestVersions.length} versions in manifest:`, manifestVersions);

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

  const missingVersions = manifestVersions.filter((v) => !availableVersions.includes(v));
  const extraVersions = availableVersions.filter((v) => !manifestVersions.includes(v));

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
    manifestVersions,
    availableVersions,
    missingVersions,
    extraVersions,
  };
}
