import type { UCDStore } from "../store";
import type { SharedStoreOperationOptions } from "../types";
import { createConcurrencyLimiter, ensureIsPositiveConcurrency } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { dirname, join } from "pathe";
import { UCDStoreGenericError } from "../errors";

export type CleanOptions = SharedStoreOperationOptions;

export interface CleanResult {
  /**
   * Cleaned Unicode version
   * This should be in the format "major.minor.patch" (e.g., "15.0.0")
   */
  version: string;

  /**
   * List of files that were successfully deleted
   */
  deleted: string[];

  /**
   * List of files that were skipped during cleaning (e.g., already deleted)
   */
  skipped: string[];

  /**
   * List of files that failed to delete (if any)
   */
  failed: string[];
}

export interface internal_CleanOptions extends Required<CleanOptions> {
  directories?: string[];
}

export async function internal__clean(store: UCDStore, options: internal_CleanOptions): Promise<CleanResult[]> {
  const {
    versions,
    dryRun,
    concurrency,
    directories,
  } = options;

  ensureIsPositiveConcurrency(concurrency, UCDStoreGenericError);

  const [analyses, error] = await store.analyze({
    checkOrphaned: true,
    versions,
  });

  if (error != null) {
    throw error;
  }

  const result: CleanResult[] = [];
  const directoriesToCheck = new Set<string>(directories);

  const promises = [];

  // create the limit function to control concurrency
  const limit = createConcurrencyLimiter(concurrency);

  for (const analysis of analyses) {
    // initialize result for this version
    const versionResult: CleanResult = {
      version: analysis.version,
      deleted: [],
      skipped: [],
      failed: [],
    };

    const joinedFiles = [...analysis.orphanedFiles, ...analysis.files];
    for (const file of joinedFiles) {
      const filePath = join(store.basePath, analysis.version, file);

      // track parent directories for cleanup
      directoriesToCheck.add(dirname(filePath));

      promises.push(limit(async () => {
        assertCapability(store.fs, "rm");

        try {
          const exists = await store.fs.exists(filePath);
          if (!exists) {
            console.error("File does not exist, skipping deletion:", filePath);
            versionResult!.skipped.push(file);
            return;
          }

          if (!dryRun) {
            await store.fs.rm(filePath);
          }

          versionResult!.deleted.push(file);
        } catch {
          versionResult!.failed.push(file);
        }
      }));
    }

    result.push(versionResult);

    // also add version directory to check for cleanup
    directoriesToCheck.add(join(store.basePath, analysis.version));
  }

  await Promise.all(promises);

  // clean up empty directories (bottom-up approach)
  if (!dryRun) {
    assertCapability(store.fs, "rm");

    // sort directories by depth (deepest first) for bottom-up cleanup
    const sortedDirectories = Array.from(directoriesToCheck).sort((a, b) => b.split("/").length - a.split("/").length);

    for (const dirPath of sortedDirectories) {
      try {
        const exists = await store.fs.exists(dirPath);
        if (!exists) continue;

        await store.fs.rm(dirPath, { recursive: true });
      } catch {
        // silently ignore directory deletion failures
      }
    }
  }

  // update the manifest after cleaning
  const manifest = await store["~readManifest"]();

  // remove the versions that were cleaned
  for (const version of versions) {
    if (manifest && manifest[version]) {
      delete manifest[version];
    }
  }

  await store["~writeManifest"](Object.keys(manifest));

  return result;
}
