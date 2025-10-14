import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { UCDStoreContext } from "./types";
import { safeJsonParse } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { UCDStoreInvalidManifestError } from "../errors";

/**
 * Write a UCD store manifest file listing the provided versions.
 *
 * The manifest is a simple JSON object that maps each version string to
 * itself. This function serializes the manifest and writes it to the
 * location specified by ctx.manifestPath using the provided filesystem
 * bridge (ctx.fs).
 *
 * @param {UCDStoreContext} ctx - UCD store context providing the filesystem bridge and manifestPath.
 * @param {string[]} versions - An array of version strings to include in the manifest.
 * @returns {Promise<void>} A promise that resolves once the manifest has been written.
 * @throws {Error} If the filesystem bridge does not support writing or if the write operation fails.
 */
export async function writeManifest(ctx: UCDStoreContext, versions: string[]): Promise<void> {
  assertCapability(ctx.fs, "write");
  const manifestData: UCDStoreManifest = {};

  for (const version of versions) {
    manifestData[version] = version;
  }

  await ctx.fs.write(ctx.manifestPath, JSON.stringify(manifestData, null, 2));
}

/**
 * Read and validate the UCD store manifest from disk (or the configured FS bridge).
 *
 * This function reads the manifest JSON from ctx.manifestPath using the provided
 * filesystem bridge (ctx.fs), parses it as JSON, and validates it against the
 * UCDStoreManifestSchema. If the manifest is missing, empty, contains invalid
 * JSON, or fails schema validation a UCDStoreInvalidManifestError is thrown.
 *
 * @param {UCDStoreContext} ctx - UCD store context providing the filesystem bridge and manifestPath.
 * @returns {Promise<UCDStoreManifest>} A Promise that resolves to the validated UCDStoreManifest.
 * @throws {UCDStoreInvalidManifestError} When the manifest is empty, not valid JSON,
 *                                        or does not conform to the expected schema.
 */
export async function readManifest(ctx: UCDStoreContext): Promise<UCDStoreManifest> {
  assertCapability(ctx.fs, "read");
  const manifestData = await ctx.fs.read(ctx.manifestPath);

  if (!manifestData) {
    throw new UCDStoreInvalidManifestError(ctx.manifestPath, "store manifest is empty");
  }

  const jsonData = safeJsonParse(manifestData);
  if (!jsonData) {
    throw new UCDStoreInvalidManifestError(ctx.manifestPath, "store manifest is not a valid JSON");
  }

  const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
  if (!parsedManifest.success) {
    throw new UCDStoreInvalidManifestError(ctx.manifestPath, `store manifest is not a valid JSON: ${parsedManifest.error.message}`);
  }

  return parsedManifest.data;
}
