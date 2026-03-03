import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { Snapshot } from "@ucdjs/schemas";
import { createDebugger, safeJsonParse, tryOr } from "@ucdjs-internal/shared";
import { SnapshotSchema } from "@ucdjs/schemas";
import { dirname } from "pathe";
import { LockfileInvalidError } from "./errors";
import { canUseLockfile } from "./lockfile";
import { getSnapshotPath } from "./paths";

const debug = createDebugger("ucdjs:lockfile:snapshot");

/**
 * Internal helper: parses and validates raw JSON content against the SnapshotSchema.
 * Throws LockfileInvalidError with the given `snapshotPath` context on failure.
 */
function parseSnapshotFromContent(content: string, snapshotPath: string): Snapshot {
  const jsonData = safeJsonParse(content);
  if (jsonData === null) {
    throw new LockfileInvalidError({
      lockfilePath: snapshotPath,
      message: "snapshot is not valid JSON",
    });
  }

  const parsedSnapshot = SnapshotSchema.safeParse(jsonData);
  if (!parsedSnapshot.success) {
    debug?.("Failed to parse snapshot:", parsedSnapshot.error.issues);
    throw new LockfileInvalidError({
      lockfilePath: snapshotPath,
      message: "snapshot does not match expected schema",
      details: parsedSnapshot.error.issues.map((issue) => issue.message),
    });
  }

  return parsedSnapshot.data;
}

/**
 * Reads and validates a snapshot for a specific version.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for reading
 * @param {string} version - The Unicode version
 * @returns {Promise<Snapshot>} A promise that resolves to the validated snapshot
 * @throws {LockfileInvalidError} When the snapshot is invalid or missing
 */
export async function readSnapshot(
  fs: FileSystemBridge,
  version: string,
): Promise<Snapshot> {
  const snapshotPath = getSnapshotPath(version);
  debug?.("Reading snapshot from:", snapshotPath);

  const snapshotData = await tryOr({
    try: fs.read(snapshotPath),
    err: (err) => {
      debug?.("Failed to read snapshot:", err);
      throw new LockfileInvalidError({
        lockfilePath: snapshotPath,
        message: "snapshot could not be read",
      });
    },
  });

  if (!snapshotData) {
    throw new LockfileInvalidError({
      lockfilePath: snapshotPath,
      message: "snapshot is empty",
    });
  }

  debug?.("Successfully read snapshot");
  return parseSnapshotFromContent(snapshotData, snapshotPath);
}

/**
 * Writes a snapshot for a specific version to the filesystem.
 * Only works if the filesystem bridge supports write operations.
 *
 * @param {FileSystemBridge} fs - Filesystem bridge to use for writing
 * @param {string} version - The Unicode version
 * @param {Snapshot} snapshot - The snapshot data to write
 * @returns {Promise<void>} A promise that resolves when the snapshot has been written
 */
export async function writeSnapshot(
  fs: FileSystemBridge,
  version: string,
  snapshot: Snapshot,
): Promise<void> {
  if (!canUseLockfile(fs)) {
    debug?.("Filesystem bridge does not support write operations, skipping snapshot write");
    return;
  }

  const snapshotPath = getSnapshotPath(version);
  const snapshotDir = dirname(snapshotPath);

  debug?.("Writing snapshot to:", snapshotPath);

  // Ensure snapshot directory exists
  const dirExists = await fs.exists(snapshotDir);
  if (!dirExists) {
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
 * @param {string} version - The Unicode version
 * @returns {Promise<Snapshot | undefined>} A promise that resolves to the snapshot or undefined
 */
export async function readSnapshotOrUndefined(
  fs: FileSystemBridge,
  version: string,
): Promise<Snapshot | undefined> {
  return readSnapshot(fs, version).catch((err) => {
    debug?.("Failed to read snapshot, returning undefined", err);
    return undefined;
  });
}

/**
 * Parses and validates snapshot content from a raw string without requiring a filesystem bridge.
 * Useful when snapshot content has been obtained from any source (HTTP, KV store, memory, etc.).
 *
 * @param {string} content - The raw snapshot content to parse
 * @returns {Snapshot} The validated snapshot
 * @throws {LockfileInvalidError} When the content is invalid or does not match the expected schema
 *
 * @example
 * ```ts
 * const response = await fetch("https://ucdjs.dev/16.0.0/snapshot.json");
 * const content = await response.text();
 * const snapshot = parseSnapshot(content);
 * ```
 */
export function parseSnapshot(content: string): Snapshot {
  debug?.("Parsing snapshot from content");

  if (!content) {
    throw new LockfileInvalidError({
      lockfilePath: "<content>",
      message: "snapshot is empty",
    });
  }

  debug?.("Successfully parsed snapshot");
  return parseSnapshotFromContent(content, "<content>");
}

/**
 * Parses and validates snapshot content from a raw string, returning undefined if parsing fails.
 *
 * @param {string} content - The raw snapshot content to parse
 * @returns {Snapshot | undefined} The validated snapshot or undefined if parsing fails
 *
 * @example
 * ```ts
 * const response = await fetch("https://ucdjs.dev/16.0.0/snapshot.json");
 * const content = await response.text();
 * const snapshot = parseSnapshotOrUndefined(content);
 * if (snapshot) {
 *   console.log("Unicode version:", snapshot.unicodeVersion);
 * }
 * ```
 */
export function parseSnapshotOrUndefined(content: string): Snapshot | undefined {
  try {
    return parseSnapshot(content);
  } catch {
    debug?.("Failed to parse snapshot, returning undefined");
    return undefined;
  }
}
