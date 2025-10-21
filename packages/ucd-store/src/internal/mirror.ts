import type { UCDStore } from "../store";
import type { SharedStoreOperationOptions } from "../types";
import { hasUCDFolderPath, resolveUCDVersion } from "@luxass/unicode-utils-new";
import { createConcurrencyLimiter, ensureIsPositiveConcurrency } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { dirname, join } from "pathe";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getExpectedFilePaths } from "./files";

export interface MirrorOptions extends SharedStoreOperationOptions {
  /**
   * Whether to overwrite existing files in the store.
   * If true, existing files will be replaced with the new content.
   */
  force?: boolean;
}

export interface MirrorResult {
  /**
   * Analyzed Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of orphaned files (files that exist but shouldn't)
   */
  mirrored: string[];

  /**
   * List of files that were skipped during mirroring (if any)
   */
  skipped: string[];

  /**
   * List of files that failed to mirror (if any)
   */
  failed: string[];
}

export async function internal__mirror(store: UCDStore, options: Required<MirrorOptions>): Promise<MirrorResult[]> {
  const { concurrency, dryRun, force, versions } = options;

  if (versions.length === 0) {
    return [];
  }

  ensureIsPositiveConcurrency(concurrency, UCDStoreGenericError);

  assertCapability(store.fs, "mkdir");

  // create the limit function to control concurrency
  const limit = createConcurrencyLimiter(concurrency);

  // pre-create directory structure to avoid repeated checks
  const directoriesToCreate = new Set<string>();

  const resultsByVersion = new Map<string, MirrorResult>();

  const filesQueue = await Promise.all(
    versions.map(async (version) => {
      if (!store.versions.includes(version)) {
        throw new UCDStoreVersionNotFoundError(version);
      }

      const filePaths = await getExpectedFilePaths(store.client, version);

      // collect unique directories
      for (const filePath of filePaths) {
        const localPath = join(store.basePath!, version, filePath);
        directoriesToCreate.add(dirname(localPath));
      }

      return filePaths.map((filePath): [string, string] => [version, filePath]);
    }),
  ).then((results) => results.flat());

  // pre-create all directories
  await Promise.all([...directoriesToCreate].map(async (dir) => {
    assertCapability(store.fs, "mkdir");
    if (!await store.fs.exists(dir)) {
      await store.fs.mkdir(dir);
    }
  }));

  await Promise.all(filesQueue.map(([version, filePath]) => limit(async () => {
    let versionResult = resultsByVersion.get(version);
    if (!versionResult) {
      versionResult = { version, mirrored: [], skipped: [], failed: [] };
      resultsByVersion.set(version, versionResult);
    }

    try {
      const isMirrored = await internal__mirrorFile(store, version, filePath, {
        force,
        dryRun,
      });

      if (isMirrored) {
        versionResult!.mirrored.push(filePath);
      } else {
        versionResult!.skipped.push(filePath);
      }
    } catch {
      versionResult!.failed.push(filePath);
    }
  })));

  return Array.from(resultsByVersion.values());
}

async function internal__mirrorFile(store: UCDStore, version: string, filePath: string, options: Pick<MirrorOptions, "force" | "dryRun">): Promise<boolean> {
  assertCapability(store.fs, ["write", "mkdir"]);
  const { force = false, dryRun = false } = options;
  const localPath = join(store.basePath!, version, filePath);

  // check if file already exists
  if (!force && await store.fs.exists(localPath)) {
    return false;
  }

  if (dryRun) {
    return true;
  }

  // download file content from the api
  // We are only returning files from inside the ucd folder.
  // But the file paths are relative from the request path, and therefore doesn't contain the
  // `ucd` folder.
  // So by adding the `ucd` folder here, we ensure that the file paths
  // we download are correct.
  const remotePath = join(resolveUCDVersion(version), hasUCDFolderPath(version) ? "ucd" : "", filePath);

  const result = await store.client.files.get(remotePath);

  if (result.error) {
    throw new UCDStoreGenericError(`Failed to fetch file '${filePath}': ${result.error.message}`);
  }

  if (!result.data) {
    throw new UCDStoreGenericError(`Failed to fetch file '${filePath}': no data returned`);
  }

  // Handle both string and JSON responses
  let content: string | Uint8Array;

  if (typeof result.data === "string") {
    content = result.data;
  } else {
    // For JSON responses, stringify them
    content = JSON.stringify(result.data, null, 2);
  }

  await store.fs.write(localPath, content);

  return true;
}
