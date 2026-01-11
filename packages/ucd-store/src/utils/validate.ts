import type { UCDClient } from "@ucdjs/client";
import { createDebugger } from "@ucdjs-internal/shared";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:validate");

export interface ValidateVersionsOptions {
  /**
   * UCD Client instance to use for API requests.
   */
  client: UCDClient;

  /**
   * Versions to validate against the API.
   */
  versions: string[];
}

export interface ValidateVersionsResult {
  /**
   * Whether all provided versions are valid (present in the API).
   */
  valid: boolean;

  /**
   * Versions that were validated.
   */
  validatedVersions: string[];

  /**
   * Versions available from the API.
   */
  availableVersions: string[];

  /**
   * Versions that are valid (present in the API).
   */
  validVersions: string[];

  /**
   * Versions that are invalid (not present in the API).
   */
  invalidVersions: string[];
}

/**
 * Validates that the provided versions are available in the API.
 * This is a pure validation function with no lockfile dependency.
 *
 * @param {ValidateVersionsOptions} options - Validation options
 * @returns {Promise<ValidateVersionsResult>} Validation result
 * @throws {UCDStoreGenericError} If API fetch fails
 */
export async function validateVersions(options: ValidateVersionsOptions): Promise<ValidateVersionsResult> {
  const { client, versions } = options;

  debug?.("Starting version validation for:", versions);

  const apiResponseResult = await client.versions.list();

  if (apiResponseResult.error) {
    throw new UCDStoreGenericError(
      `Failed to fetch Unicode versions during validation: ${apiResponseResult.error.message}${
        apiResponseResult.error.status ? ` (status ${apiResponseResult.error.status})` : ""
      }`,
    );
  }

  if (!apiResponseResult.data) {
    throw new UCDStoreGenericError("Failed to fetch Unicode versions during validation: no data returned");
  }

  const availableVersions = apiResponseResult.data.map(({ version }) => version);
  debug?.(`Fetched ${availableVersions.length} available versions from API`);

  const validVersions = versions.filter((v) => availableVersions.includes(v));
  const invalidVersions = versions.filter((v) => !availableVersions.includes(v));

  const valid = invalidVersions.length === 0;
  debug?.(
    valid ? "✓ Validation passed" : "✗ Validation failed",
    {
      valid: validVersions.length,
      invalid: invalidVersions.length,
    },
  );

  if (invalidVersions.length > 0) {
    debug?.("Invalid versions:", invalidVersions);
  }

  return {
    valid,
    validatedVersions: versions,
    availableVersions,
    validVersions,
    invalidVersions,
  };
}
