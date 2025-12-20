import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Snapshot } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse } from "@ucdjs-internal/shared";
import { SnapshotSchema } from "@ucdjs/schemas";
import { dirname, join } from "pathe";
import { UCDStoreInvalidManifestError } from "../errors";
import { canUseLockfile } from "./lockfile";

const debug = createDebugger("ucdjs:ucd-store:snapshot");

/**
 * Converts a string to Uint8Array using UTF-8 encoding.
 */
function stringToUint8Array(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }
  // Fallback for environments without TextEncoder
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
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
  if (!dirExists && fs.mkdir) {
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
  return readSnapshot(fs, basePath, version).catch(() => {
    debug?.("Failed to read snapshot, returning undefined");
    return undefined;
  });
}

/**
 * Gets the snapshot path for a given version.
 */
export function getSnapshotPath(basePath: string, version: string): string {
  return join(basePath, ".snapshots", `${version}.json`);
}
