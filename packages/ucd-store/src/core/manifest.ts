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
 * @param {string[]} versions - An array of version strings to include in the manifest
 * @returns {Promise<void>} A promise that resolves once the manifest has been written
 * @throws {Error} If the filesystem bridge does not support writing or if the write operation fails
 */
export async function writeManifest(
  fs: FileSystemBridge,
  manifestPath: string,
  versions: string[],
): Promise<void> {
  debug?.("Writing manifest", { manifestPath, versions });
  assertCapability(fs, "write");
  const manifestData: UCDStoreManifest = {};

  for (const version of versions) {
    manifestData[version] = version;
  }

  await fs.write(manifestPath, JSON.stringify(manifestData, null, 2));
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
    throw new UCDStoreInvalidManifestError(manifestPath, "store manifest is empty");
  }

  const jsonData = safeJsonParse(manifestData);
  if (!jsonData) {
    debug?.("Failed to read manifest: store manifest is not valid JSON");
    throw new UCDStoreInvalidManifestError(manifestPath, "store manifest is not a valid JSON");
  }

  const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
  if (!parsedManifest.success) {
    debug?.("Failed to read manifest: store manifest failed schema validation", { errors: parsedManifest.error.issues });
    throw new UCDStoreInvalidManifestError(manifestPath, `store manifest is not a valid JSON: ${parsedManifest.error.message}`);
  }

  return parsedManifest.data;
}
