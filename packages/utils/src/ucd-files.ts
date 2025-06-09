import type { FSAdapter } from "./types";
import path from "node:path";

export interface MirrorOptions {
  /**
   * List of Unicode versions to download files for.
   * Each version should be a string representing the Unicode version (e.g., "15.0.0", "14.0.0").
   */
  versions: string[];

  /**
   * Optional base path where files will be downloaded.
   * Defaults to "./ucd-files" if not provided.
   */
  basePath?: string;

  /**
   * Optional filesystem interface to use for file operations.
   * If not provided, a default implementation using fs-extra will be used.
   */
  fs?: FSAdapter;
}

export async function mirrorUCDFiles(options: MirrorOptions): Promise<void> {
  const {
    versions,
    basePath = path.resolve("./ucd-files"),
    fs = await createDefaultFSAdapter(),
  } = options;

  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("At least one Unicode version must be provided.");
  }
}

/**
 * Creates a default file system adapter implementation using Node.js fs/promises module.
 *
 * This adapter provides basic file system operations needed for UCD file handling.
 * Currently, it only implements the readFile method, but could be extended with
 * additional functionality as needed.
 *
 * @returns {Promise<FSAdapter>} A Promise that resolves to a {@link FSAdapter} implementation
 * @throws Error if the Node.js fs module cannot be loaded
 */
export async function createDefaultFSAdapter(): Promise<FSAdapter> {
  try {
    const fsModule = await import("node:fs/promises");

    return {
      async readFile(path) {
        return fsModule.readFile(path, "utf-8");
      },
    };
  } catch (err) {
    throw new Error("Failed to load file system module", {
      cause: err,
    });
  }
}
