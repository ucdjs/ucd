import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Lockfile } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse } from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { LockfileSchema } from "@ucdjs/schemas";
import { join } from "pathe";
import { UCDStoreInvalidManifestError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:lockfile");

/**
 * Checks if the filesystem bridge supports lockfile operations (requires write capability)
 */
// eslint-disable-next-line ts/explicit-function-return-type
export function canUseLockfile(fs: FileSystemBridge) {
  return hasCapability(fs, "write");
}

/**
 * Reads and validates a lockfile from the filesystem.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} lockfilePath - Path to the lockfile
 * @returns {Promise<Lockfile>} A promise that resolves to the validated lockfile
 * @throws {UCDStoreInvalidManifestError} When the lockfile is invalid or missing
 */
export async function readLockfile(
  fs: FileSystemBridge,
  lockfilePath: string,
): Promise<Lockfile> {
  debug?.("Reading lockfile from:", lockfilePath);

  const lockfileData = await fs.read(lockfilePath);

  if (!lockfileData) {
    throw new UCDStoreInvalidManifestError({
      manifestPath: lockfilePath,
      message: "lockfile is empty",
    });
  }

  const jsonData = safeJsonParse(lockfileData);
  if (!jsonData) {
    throw new UCDStoreInvalidManifestError({
      manifestPath: lockfilePath,
      message: "lockfile is not valid JSON",
    });
  }

  const parsedLockfile = LockfileSchema.safeParse(jsonData);
  if (!parsedLockfile.success) {
    debug?.("Failed to parse lockfile:", parsedLockfile.error.issues);
    throw new UCDStoreInvalidManifestError({
      manifestPath: lockfilePath,
      message: "lockfile does not match expected schema",
      details: parsedLockfile.error.issues.map((issue) => issue.message),
    });
  }

  debug?.("Successfully read lockfile");
  return parsedLockfile.data;
}

/**
 * Writes a lockfile to the filesystem.
 * If the filesystem bridge does not support write operations, the function
 * will skip writing the lockfile and return without throwing.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for writing
 * @param {string} lockfilePath - Path where the lockfile should be written
 * @param {Lockfile} lockfile - The lockfile data to write
 * @returns {Promise<void>} A promise that resolves when the lockfile has been written
 * @throws {Error} If the filesystem bridge does not support writing
 */
export async function writeLockfile(
  fs: FileSystemBridge,
  lockfilePath: string,
  lockfile: Lockfile,
): Promise<void> {
  if (!canUseLockfile(fs)) {
    debug?.("Filesystem bridge does not support write operations, skipping lockfile write");
    return;
  }

  debug?.("Writing lockfile to:", lockfilePath);
  await fs.write(lockfilePath, JSON.stringify(lockfile, null, 2));
  debug?.("Successfully wrote lockfile");
}

/**
 * Reads a lockfile or returns undefined if it doesn't exist or is invalid.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} lockfilePath - Path to the lockfile
 * @returns {Promise<Lockfile | undefined>} A promise that resolves to the lockfile or undefined
 */
export async function readLockfileOrDefault(
  fs: FileSystemBridge,
  lockfilePath: string,
): Promise<Lockfile | undefined> {
  return readLockfile(fs, lockfilePath).catch(() => {
    debug?.("Failed to read lockfile, returning undefined");
    return undefined;
  });
}

/**
 * Gets the default lockfile path for a given base path.
 */
export function getLockfilePath(basePath: string): string {
  return join(basePath, ".ucd-store.lock");
}
