import type { UCDStore } from "../store";
import type { SharedStoreOperationOptions } from "../types";
import type { AnalyzeResult } from "./analyze";
import { assertCapability } from "@ucdjs/fs-bridge";
import { createConcurrencyLimiter, ensureIsPositiveConcurrency } from "@ucdjs-internal/shared";
import { dirname, join } from "pathe";
import { UCDStoreGenericError } from "../errors";
import { internal__analyze } from "./analyze";
import { internal__clean } from "./clean";
import { internal__mirror } from "./mirror";

export type RepairOptions = SharedStoreOperationOptions;

export interface RepairResult {
  version: string;

  status: "success" | "failure";

  /**
   * Files that were successfully downloaded/restored
   */
  restored: string[];

  /**
   * Orphaned files that were removed
   */
  removed: string[];

  /**
   * Files that were skipped (already correct)
   */
  skipped: string[];

  /**
   * Files that failed to repair (with error info)
   */
  failed: Array<{
    filePath: string;
    error: string;
    operation: "download" | "remove";
  }>;
}

export async function internal__repair(store: UCDStore, options: Required<RepairOptions>): Promise<RepairResult[]> {
  const {
    concurrency,
    dryRun,
    versions,
  } = options;

  if (versions.length === 0) {
    return [];
  }

  ensureIsPositiveConcurrency(concurrency, UCDStoreGenericError);

  // analyze store to find what needs repairing
  const analyzeResults = await internal__analyze(store, {
    checkOrphaned: true,
    versions,
  });

  // initialize repair results
  const repairResults: RepairResult[] = analyzeResults.map((analysis) => ({
    version: analysis.version,
    status: "success" as const,
    restored: [],
    removed: [],
    // skipped contains files that were not processed.
    skipped: analysis.files.length === 0 ? [] : [...analysis.files],
    failed: [],
  }));

  // remove orphaned files
  const directoriesToCheck = await handleOrphanedFiles(store, analyzeResults, repairResults, {
    dryRun,
    concurrency,
  });

  // restore missing files
  await handleMissingFiles(store, analyzeResults, repairResults, {
    dryRun,
    concurrency,
  });

  // clean up empty directories
  if (!dryRun && directoriesToCheck.length > 0) {
    await internal__clean(store, {
      versions: [],
      concurrency,
      dryRun,
      directories: Array.from(directoriesToCheck),
    });
  }

  return repairResults;
}

async function handleOrphanedFiles(
  store: UCDStore,
  analyzeResults: AnalyzeResult[],
  repairResults: RepairResult[],
  options: { dryRun: boolean; concurrency: number },
): Promise<string[]> {
  const limit = createConcurrencyLimiter(options.concurrency);

  const parentDirectoriesUnique = new Set<string>();
  const allOperations: Promise<void>[] = [];

  for (let i = 0; i < analyzeResults.length; i++) {
    const analysis = analyzeResults[i];
    const versionResult = repairResults[i];

    if (!analysis || !versionResult || analysis.isComplete) continue;

    for (const orphanedFile of analysis.orphanedFiles) {
      allOperations.push(limit(async () => {
        try {
          assertCapability(store.fs, ["exists", "rm"]);
          const filePath = join(store.basePath, analysis.version, orphanedFile);
          parentDirectoriesUnique.add(dirname(filePath));

          if (options.dryRun) {
            versionResult.removed.push(orphanedFile);
            return;
          }

          const exists = await store.fs.exists(filePath);
          if (!exists) {
            versionResult.failed.push({
              filePath: orphanedFile,
              error: "File does not exist",
              operation: "remove",
            });

            versionResult.status = "failure";
            return;
          }

          await store.fs.rm(filePath);

          versionResult.removed.push(orphanedFile);
        } catch (err) {
          versionResult.failed.push({
            filePath: orphanedFile,
            error: err instanceof Error ? err.message : String(err),
            operation: "remove",
          });
          versionResult.status = "failure";
        }
      }));
    }
  }

  await Promise.all(allOperations);

  const parentDirectories = [];

  // for each parent directory, check if it is empty..
  // If it is, keep it in the list.
  for (const dir of parentDirectoriesUnique) {
    assertCapability(store.fs, ["listdir"]);

    const files = await store.fs.listdir(dir);
    if (files.length === 0) {
      parentDirectories.push(dir);
    }
  }

  return parentDirectories;
}

async function handleMissingFiles(
  store: UCDStore,
  analyzeResults: AnalyzeResult[],
  repairResults: RepairResult[],
  options: { dryRun: boolean; concurrency: number },
): Promise<void> {
  const versionsWithMissingFiles = analyzeResults.filter((analysis) =>
    !analysis.isComplete && analysis.missingFiles.length > 0,
  );

  if (versionsWithMissingFiles.length === 0) return;

  try {
    const mirrorResults = await internal__mirror(store, {
      ...options,
      force: false,
      versions: versionsWithMissingFiles.map((a) => a.version),
    });

    for (const analysis of versionsWithMissingFiles) {
      const versionResult = repairResults.find((r) => r.version === analysis.version)!;
      const mirrorResult = mirrorResults.find((r) => r.version === analysis.version);

      if (mirrorResult) {
        const failedSet = new Set(mirrorResult.failed);
        const restoredFiles = mirrorResult.mirrored.filter((file) =>
          analysis.missingFiles.includes(file),
        );
        versionResult.restored.push(...restoredFiles);

        for (const failedFile of failedSet) {
          if (analysis.missingFiles.includes(failedFile)) {
            versionResult.failed.push({
              filePath: failedFile,
              error: "Failed to download file",
              operation: "download",
            });
            versionResult.status = "failure";
          }
        }

        // any remaining missing files are still unresolved => mark as failure
        for (const missingFile of analysis.missingFiles) {
          if (!restoredFiles.includes(missingFile) && !failedSet.has(missingFile)) {
            versionResult.failed.push({
              filePath: missingFile,
              error: "File not restored",
              operation: "download",
            });
            versionResult.status = "failure";
          }
        }
      } else {
        // mirror produced no result for this version; mark all missing as failed
        for (const missingFile of analysis.missingFiles) {
          versionResult.failed.push({
            filePath: missingFile,
            error: "Mirroring returned no result",
            operation: "download",
          });
        }
        versionResult.status = "failure";
      }
    }
  } catch (err) {
    for (const analysis of versionsWithMissingFiles) {
      const versionResult = repairResults.find((r) => r.version === analysis.version)!;
      for (const missingFile of analysis.missingFiles) {
        versionResult.failed.push({
          filePath: missingFile,
          error: err instanceof Error ? err.message : String(err),
          operation: "download",
        });
      }
      versionResult.status = "failure";
    }
  }
}
