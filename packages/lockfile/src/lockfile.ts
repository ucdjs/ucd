import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Lockfile, LockfileInput } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse } from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { LockfileSchema } from "@ucdjs/schemas";
import { LockfileInvalidError } from "./errors";

const debug = createDebugger("ucdjs:lockfile");

/**
 * Checks if the filesystem bridge supports lockfile operations (requires write capability)
 *
 * @param {FileSystemBridge} fs - The filesystem bridge to check
 * @returns {boolean} True if the bridge supports lockfile operations
 */
export function canUseLockfile(fs: FileSystemBridge): fs is FileSystemBridge & Required<Pick<FileSystemBridge, "write">> {
  return hasCapability(fs, "write");
}

/**
 * Reads and validates a lockfile from the filesystem.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} lockfilePath - Path to the lockfile
 * @returns {Promise<Lockfile>} A promise that resolves to the validated lockfile
 * @throws {LockfileInvalidError} When the lockfile is invalid or missing
 */
export async function readLockfile(
  fs: FileSystemBridge,
  lockfilePath: string,
): Promise<Lockfile> {
  debug?.("Reading lockfile from:", lockfilePath);

  const lockfileData = await fs.read(lockfilePath);

  if (!lockfileData) {
    throw new LockfileInvalidError({
      lockfilePath,
      message: "lockfile is empty",
    });
  }

  const jsonData = safeJsonParse(lockfileData);
  if (!jsonData) {
    throw new LockfileInvalidError({
      lockfilePath,
      message: "lockfile is not valid JSON",
    });
  }

  const parsedLockfile = LockfileSchema.safeParse(jsonData);
  if (!parsedLockfile.success) {
    debug?.("Failed to parse lockfile:", parsedLockfile.error.issues);
    throw new LockfileInvalidError({
      lockfilePath,
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
 * @param {LockfileInput} lockfile - The lockfile data to write
 * @returns {Promise<void>} A promise that resolves when the lockfile has been written
 */
export async function writeLockfile(
  fs: FileSystemBridge,
  lockfilePath: string,
  lockfile: LockfileInput,
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
