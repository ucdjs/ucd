import type { InternalUCDStoreContext } from "../types";
import { createDebugger, tryOr } from "@ucdjs-internal/shared";
import { readLockfile } from "@ucdjs/lockfile";
import { UCDStoreGenericError } from "../errors";
import { validateVersions } from "./validate";

const debug = createDebugger("ucdjs:ucd-store:verify");

export interface VerifyOptions {
  /**
   * Internal store context.
   */
  context: InternalUCDStoreContext;
}

export interface VerifyResult {
  /**
   * Whether the verification passed (all versions are valid).
   */
  valid: boolean;

  /**
   * The source of versions that were verified.
   */
  source: "lockfile" | "store";

  /**
   * Versions that were verified.
   */
  verifiedVersions: string[];

  /**
   * Versions available from the API.
   */
  availableVersions: string[];

  /**
   * Versions that are invalid (not present in the API).
   */
  invalidVersions: string[];

  /**
   * Versions available in the API but not in the store/lockfile.
   * Only populated when source is "lockfile".
   */
  extraVersions: string[];
}

/**
 * Verifies that store versions are available in the API.
 *
 * If the store supports lockfiles and one exists, it verifies the lockfile versions.
 * Otherwise, it validates the store's configured versions directly against the API.
 *
 * @param {VerifyOptions} options - Verification options
 * @returns {Promise<VerifyResult>} Verification result with comparison details
 * @throws {UCDStoreGenericError} If lockfile read or API fetch fails
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const { context } = options;
  const { client, fs } = context;
  const { supports: supportsLockfile, exists: lockfileExists, path: lockfilePath } = context.lockfile;
  const versions = context.versions.resolved;

  // If we have lockfile support and a lockfile exists, verify against lockfile
  if (supportsLockfile && lockfileExists && lockfilePath) {
    debug?.("Starting lockfile verification");

    const lockfile = await tryOr({
      try: () => readLockfile(fs, lockfilePath),
      err: (err) => {
        throw new UCDStoreGenericError(`Failed to read lockfile at ${lockfilePath}: ${(err as any).message}`);
      },
    });

    const lockfileVersions = Object.keys(lockfile.versions || {});
    debug?.(`Found ${lockfileVersions.length} versions in lockfile:`, lockfileVersions);

    const validationResult = await validateVersions({
      client,
      versions: lockfileVersions,
    });

    const extraVersions = validationResult.availableVersions.filter((v) => !lockfileVersions.includes(v));

    debug?.(
      validationResult.valid ? "✓ Lockfile verification passed" : "✗ Lockfile verification failed",
      {
        invalid: validationResult.invalidVersions.length,
        extra: extraVersions.length,
      },
    );

    return {
      valid: validationResult.valid,
      source: "lockfile",
      verifiedVersions: lockfileVersions,
      availableVersions: validationResult.availableVersions,
      invalidVersions: validationResult.invalidVersions,
      extraVersions,
    };
  }

  // No lockfile - validate store versions directly
  debug?.("Starting store version validation (no lockfile)");

  const validationResult = await validateVersions({
    client,
    versions,
  });

  debug?.(
    validationResult.valid ? "✓ Version validation passed" : "✗ Version validation failed",
    {
      invalid: validationResult.invalidVersions.length,
    },
  );

  return {
    valid: validationResult.valid,
    source: "store",
    verifiedVersions: versions,
    availableVersions: validationResult.availableVersions,
    invalidVersions: validationResult.invalidVersions,
    extraVersions: [], // Not applicable for store-based verification
  };
}
