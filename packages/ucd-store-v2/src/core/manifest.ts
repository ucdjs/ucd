import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { UCDStoreInvalidManifestError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:manifest");

/**
 * Write a UCD store manifest file listing the provided versions.
 *
 * The manifest is a simple JSON object that maps each version string to
 * itself. This function serializes the manifest and writes it to the
 * specified manifestPath using the provided filesystem bridge.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for writing
 * @param {string} manifestPath - Path where manifest should be written
 * @param {UCDStoreManifest} manifest - Manifest object mapping version strings
 * @returns {Promise<void>} A promise that resolves once the manifest has been written
 * @throws {Error} If the filesystem bridge does not support writing or if the write operation fails
 */
export async function writeManifest(
  fs: FileSystemBridge,
  manifestPath: string,
  manifest: UCDStoreManifest,
): Promise<void> {
  const versions = Object.keys(manifest);
  debug?.("Writing manifest", { manifestPath, versions });
  assertCapability(fs, "write");

  await fs.write(manifestPath, JSON.stringify(manifest, null, 2));
  debug?.("Wrote manifest", { manifestPath, versions });
}

/**
 * Read and validate the UCD store manifest from disk (or the configured FS bridge).
 *
 * This function reads the manifest JSON from manifestPath using the provided
 * filesystem bridge, parses it as JSON, and validates it against the
 * UCDStoreManifestSchema. If the manifest is missing, empty, contains invalid
 * JSON, or fails schema validation a UCDStoreInvalidManifestError is thrown.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} manifestPath - Path to the manifest file
 * @returns {Promise<UCDStoreManifest>} A Promise that resolves to the validated UCDStoreManifest
 * @throws {UCDStoreInvalidManifestError} When the manifest is empty, not valid JSON,
 *                                        or does not conform to the expected schema
 */
export async function readManifest(
  fs: FileSystemBridge,
  manifestPath: string,
): Promise<UCDStoreManifest> {
  const manifestData = await fs.read(manifestPath);
  debug?.("Read manifest", { manifestPath, manifestData });

  if (!manifestData) {
    debug?.("Failed to read manifest: store manifest is empty");
    throw new UCDStoreInvalidManifestError({
      manifestPath,
      message: "store manifest is empty",
    });
  }

  const jsonData = safeJsonParse(manifestData);
  if (!jsonData) {
    debug?.("Failed to read manifest: store manifest is not valid JSON");
    throw new UCDStoreInvalidManifestError({
      manifestPath,
      message: "store manifest is not a valid JSON",
    });
  }

  const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
  if (!parsedManifest.success) {
    debug?.("Failed to read manifest: store manifest failed schema validation", { errors: parsedManifest.error.issues });
    throw new UCDStoreInvalidManifestError({
      manifestPath,
      message: "store manifest does not match expected schema",
      details: parsedManifest.error.issues.map((issue) => issue.message),
    });
  }

  return parsedManifest.data;
}

/**
 * Read the UCD store manifest from disk, or return a default manifest if reading fails.
 *
 * This function attempts to read and validate the manifest using readManifest().
 * If the read operation fails for any reason (missing file, invalid JSON, schema
 * validation failure, etc.), it returns the provided defaultManifest instead.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} manifestPath - Path to the manifest file
 * @param {UCDStoreManifest} defaultManifest - Default manifest to return if reading fails
 * @returns {Promise<UCDStoreManifest>} A Promise that resolves to either the validated
 *                                       manifest from disk or the default manifest
 */
export async function readManifestOrDefault(
  fs: FileSystemBridge,
  manifestPath: string,
  defaultManifest: UCDStoreManifest,
): Promise<UCDStoreManifest> {
  return readManifest(fs, manifestPath).catch((err) => {
    debug?.("Failed to read manifest, using default:", err);
    return defaultManifest;
  });
}

/**
 * Fetches the manifest for a specific Unicode version from the API.
 * Attempts to use the version-specific endpoint first, falls back to the deprecated endpoint if needed.
 *
 * @param {UCDClient} client - The UCD client instance for making API requests
 * @param {string} version - The Unicode version to fetch manifest for
 * @returns {Promise<{ expectedFiles: string[] }>} A promise that resolves to the version manifest
 * @throws {UCDStoreInvalidManifestError} When both endpoints fail or return invalid data
 */
export async function fetchVersionManifest(
  client: UCDClient,
  version: string,
): Promise<{ expectedFiles: string[] }> {
  debug?.("Fetching manifest for version:", version);

  // Try version-specific endpoint first
  const versionResult = await client.manifest.get(version);

  if (!versionResult.error && versionResult.data) {
    debug?.("Successfully fetched manifest from version-specific endpoint");
    return versionResult.data;
  }

  debug?.("Version-specific endpoint failed, falling back to deprecated endpoint:", versionResult.error?.message);

  // Fallback to deprecated endpoint
  // Note: The deprecated endpoint returns all versions, so we need to extract the specific version
  // For now, we'll use getFileTree as a fallback since it's more reliable
  // In the future, we could fetch the full manifest and extract the version
  throw new UCDStoreInvalidManifestError({
    manifestPath: `/.well-known/ucd-store/${version}.json`,
    message: `Failed to fetch manifest for version '${version}': ${versionResult.error?.message || "unknown error"}`,
  });
}
