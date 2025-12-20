import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Lockfile, Snapshot } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse } from "@ucdjs-internal/shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { LockfileSchema, SnapshotSchema } from "@ucdjs/schemas";
import { dirname, join } from "pathe";
import { UCDStoreBridgeUnsupportedOperation, UCDStoreInvalidManifestError } from "../errors";

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

/**
 * Converts a string to Uint8Array using UTF-8 encoding.
 */
function stringToUint8Array(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }

  // Fallback for environments without TextEncoder: manual UTF-8 encoding
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i);
    if (codePoint === undefined) {
      continue;
    }
    // If this is a surrogate pair, advance an extra code unit
    if (codePoint > 0xFFFF) {
      i++;
    }
    if (codePoint <= 0x7F) {
    // 1-byte sequence
      bytes.push(codePoint);
    } else if (codePoint <= 0x7FF) {
    // 2-byte sequence
      bytes.push(
        0xC0 | (codePoint >> 6),
        0x80 | (codePoint & 0x3F),
      );
    } else if (codePoint <= 0xFFFF) {
    // 3-byte sequence
      bytes.push(
        0xE0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F),
      );
    } else {
    // 4-byte sequence
      bytes.push(
        0xF0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3F),
        0x80 | ((codePoint >> 6) & 0x3F),
        0x80 | (codePoint & 0x3F),
      );
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Converts a Uint8Array to a hex string.
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes the SHA-256 hash of file content using Web Crypto API.
 * This is a basic implementation that works in both browser and Node.js environments.
 *
 * @param {string | Uint8Array} content - The file content to hash
 * @returns {Promise<string>} A promise that resolves to the hash in format "sha256:..."
 */
export async function computeFileHash(content: string | Uint8Array): Promise<string> {
  // Convert string to Uint8Array if needed
  const data = typeof content === "string" ? stringToUint8Array(content) : content;

  // Ensure we have a proper ArrayBufferView for crypto.subtle.digest
  const buffer = data.buffer instanceof ArrayBuffer
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : new Uint8Array(data).buffer;

  // Use Web Crypto API (available in browsers and Node.js 18+)
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = uint8ArrayToHex(hashArray);
    return `sha256:${hashHex}`;
  }

  // Fallback: This should not happen in modern environments, but provide a basic implementation
  // Note: This is a placeholder that can be replaced with a proper crypto library later
  throw new Error(
    "SHA-256 hashing is not available. Web Crypto API is required for hash computation.",
  );
}

/**
 * Reads and validates a snapshot for a specific version.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} basePath - Base path of the store
 * @param {string} version - The Unicode version
 * @returns {Promise<Snapshot>} A promise that resolves to the validated snapshot
 * @throws {UCDStoreInvalidManifestError} When the snapshot is invalid or missing
 */
export async function readSnapshot(
  fs: FileSystemBridge,
  basePath: string,
  version: string,
): Promise<Snapshot> {
  const snapshotPath = getSnapshotPath(basePath, version);
  debug?.("Reading snapshot from:", snapshotPath);

  const snapshotData = await fs.read(snapshotPath);

  if (!snapshotData) {
    throw new UCDStoreInvalidManifestError({
      manifestPath: snapshotPath,
      message: "snapshot is empty",
    });
  }

  const jsonData = safeJsonParse(snapshotData);
  if (!jsonData) {
    throw new UCDStoreInvalidManifestError({
      manifestPath: snapshotPath,
      message: "snapshot is not valid JSON",
    });
  }

  const parsedSnapshot = SnapshotSchema.safeParse(jsonData);
  if (!parsedSnapshot.success) {
    debug?.("Failed to parse snapshot:", parsedSnapshot.error.issues);
    throw new UCDStoreInvalidManifestError({
      manifestPath: snapshotPath,
      message: "snapshot does not match expected schema",
      details: parsedSnapshot.error.issues.map((issue) => issue.message),
    });
  }

  debug?.("Successfully read snapshot");
  return parsedSnapshot.data;
}

/**
 * Writes a snapshot for a specific version to the filesystem.
 * Only works if the filesystem bridge supports write operations.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for writing
 * @param {string} basePath - Base path of the store
 * @param {string} version - The Unicode version
 * @param {Snapshot} snapshot - The snapshot data to write
 * @returns {Promise<void>} A promise that resolves when the snapshot has been written
 * @throws {UCDStoreBridgeUnsupportedOperation} When directory doesn't exist and mkdir is not available
 */
export async function writeSnapshot(
  fs: FileSystemBridge,
  basePath: string,
  version: string,
  snapshot: Snapshot,
): Promise<void> {
  if (!canUseLockfile(fs)) {
    debug?.("Filesystem bridge does not support write operations, skipping snapshot write");
    return;
  }

  const snapshotPath = getSnapshotPath(basePath, version);
  const snapshotDir = dirname(snapshotPath);

  debug?.("Writing snapshot to:", snapshotPath);

  // Ensure snapshot directory exists
  const dirExists = await fs.exists(snapshotDir);
  if (!dirExists) {
    if (!fs.mkdir) {
      const availableCapabilities = Object.keys(fs.optionalCapabilities).filter(
        (k) => fs.optionalCapabilities[k as keyof typeof fs.optionalCapabilities],
      );
      throw new UCDStoreBridgeUnsupportedOperation(
        "writeSnapshot",
        ["mkdir"],
        availableCapabilities,
      );
    }
    debug?.("Creating snapshot directory:", snapshotDir);
    await fs.mkdir(snapshotDir);
  }

  await fs.write(snapshotPath, JSON.stringify(snapshot, null, 2));
  debug?.("Successfully wrote snapshot");
}

/**
 * Reads a snapshot or returns undefined if it doesn't exist or is invalid.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} basePath - Base path of the store
 * @param {string} version - The Unicode version
 * @returns {Promise<Snapshot | undefined>} A promise that resolves to the snapshot or undefined
 */
export async function readSnapshotOrDefault(
  fs: FileSystemBridge,
  basePath: string,
  version: string,
): Promise<Snapshot | undefined> {
  return readSnapshot(fs, basePath, version).catch((err) => {
    debug?.("Failed to read snapshot, returning undefined", err);
    return undefined;
  });
}

/**
 * Gets the snapshot path for a given version.
 * Snapshots are stored inside version directories: v{version}/snapshot.json
 */
export function getSnapshotPath(basePath: string, version: string): string {
  return join(basePath, `v${version}`, "snapshot.json");
}
