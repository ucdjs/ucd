import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { CLIError } from "../../errors";
import { printHelp } from "../../cli-utils";
import {
  blankLine,
  cyan,
  formatDuration,
  green,
  header,
  keyValue,
  list,
  output,
  red,
  yellow,
} from "../../output";
import { assertLocalStore, createStoreFromFlags, LOCAL_STORE_FLAGS, SHARED_FLAGS } from "./_shared";

export interface CLIStoreSyncCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    concurrency?: number;
    removeUnavailable?: boolean;
    clean?: boolean;
    json?: boolean;
  }>>;
  versions: string[];
}

export async function runSyncStore({ flags, versions }: CLIStoreSyncCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Sync lockfile with API and mirror files",
      commandName: "ucd store sync",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...LOCAL_STORE_FLAGS,
          ...SHARED_FLAGS,
          ["--concurrency", "Maximum concurrent downloads (default: 5)."],
          ["--remove-unavailable", "Remove versions from lockfile that are not available in API."],
          ["--clean", "Remove orphaned files (files not in expected files list)."],
          ["--json", "Output sync results in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  assertLocalStore(flags);

  const {
    storeDir,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    force,
    concurrency = 5,
    removeUnavailable,
    clean,
    json,
  } = flags;

  try {
    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      requireExistingStore: true,
      versionStrategy: "merge",
    });

    if (!json) {
      header("Sync Operation");

      keyValue("Store Path", storeDir, { valueColor: cyan });
      if (versions.length > 0) {
        keyValue("Versions", versions.map((v) => cyan(v)).join(", "));
      } else {
        keyValue("Versions", "all versions in lockfile");
      }

      blankLine();
    }

    const [syncResult, syncError] = await store.sync({
      versions: versions.length > 0 ? versions : undefined,
      force,
      concurrency,
      removeUnavailable,
      cleanOrphaned: clean,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (syncError) {
      if (json) {
        output.errorJson({
          type: "SYNC_FAILED",
          message: "Sync operation failed",
          details: { reason: syncError.message },
        });
      } else {
        output.fail("Sync operation failed", {
          details: [syncError.message],
        });
      }
      return;
    }

    if (!syncResult) {
      if (json) {
        output.errorJson({
          type: "NO_RESULT",
          message: "Sync operation returned no result",
        });
      } else {
        output.fail("Sync operation returned no result");
      }
      return;
    }

    if (json) {
      const jsonOutput: Record<string, unknown> = {
        success: true,
        storeDir,
        lockfileChanges: {
          added: syncResult.added,
          removed: syncResult.removed,
          unchanged: syncResult.unchanged,
          totalVersions: syncResult.versions.length,
        },
      };

      if (syncResult.mirrorReport?.summary) {
        const { counts, duration, storage } = syncResult.mirrorReport.summary;
        jsonOutput.mirrorSummary = {
          versionsCount: syncResult.mirrorReport.versions.size,
          downloaded: counts.success,
          skipped: counts.skipped,
          failed: counts.failed,
          totalSize: storage.totalSize,
          duration,
        };
      }

      if (syncResult.removedFiles.size > 0) {
        jsonOutput.orphanedFilesRemoved = Array.from(syncResult.removedFiles.entries()).map(([version, files]) => ({
          version,
          files,
        }));
      }

      output.json(jsonOutput);
      return;
    }

    output.success("Sync completed");

    // Display lockfile update results
    if (syncResult.added.length > 0 || syncResult.removed.length > 0 || syncResult.unchanged.length > 0) {
      header("Lockfile Changes");

      if (syncResult.added.length > 0) {
        keyValue("Added", `${green(String(syncResult.added.length))} version(s)`);
        list(syncResult.added, { prefix: "+", itemColor: green, indent: 4 });
      }
      if (syncResult.removed.length > 0) {
        keyValue("Removed", `${yellow(String(syncResult.removed.length))} version(s)`);
        list(syncResult.removed, { prefix: "-", itemColor: yellow, indent: 4 });
      }
      if (syncResult.unchanged.length > 0) {
        keyValue("Unchanged", `${syncResult.unchanged.length} version(s)`);
      }
    }

    keyValue("Total Versions", String(syncResult.versions.length));

    if (syncResult.mirrorReport) {
      const report = syncResult.mirrorReport;
      if (report.summary) {
        const { counts, duration, storage } = report.summary;

        header("Mirror Summary");

        keyValue("Versions", String(report.versions.size));
        keyValue("Downloaded", `${green(String(counts.success))} files`);
        keyValue("Skipped", `${yellow(String(counts.skipped))} files`);
        if (counts.failed > 0) {
          keyValue("Failed", `${red(String(counts.failed))} files`);
        }
        keyValue("Total Size", storage.totalSize);
        keyValue("Duration", formatDuration(duration));
      }

      // Show per-version details if multiple versions
      if (report.versions.size > 1) {
        header("Version Details");

        for (const [version, versionReport] of report.versions) {
          output.log(`  ${cyan(version)}`);
          output.log(`    Downloaded: ${green(String(versionReport.counts.success))}, Skipped: ${yellow(String(versionReport.counts.skipped))}`);
          if (versionReport.counts.failed > 0) {
            output.log(`    ${red(`Failed: ${versionReport.counts.failed}`)}`);
          }
          blankLine();
        }
      }
    }

    // Show removed orphaned files if any
    if (syncResult.removedFiles.size > 0) {
      header("Orphaned Files Removed");

      for (const [version, removedFiles] of syncResult.removedFiles) {
        if (removedFiles.length > 0) {
          output.log(`  ${cyan(version)}`);
          list(removedFiles, { prefix: "-", indent: 4, itemColor: yellow });
          blankLine();
        }
      }
    } else if (clean) {
      output.success("No orphaned files found");
    }

    blankLine();
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      if (json) {
        output.errorJson({
          type: "STORE_ERROR",
          message: err.message,
        });
      } else {
        output.fail(err.message);
      }
      return;
    }

    if (err instanceof CLIError) {
      if (json) {
        output.errorJson({
          type: "CLI_ERROR",
          message: err.message,
        });
      } else {
        err.toPrettyMessage();
      }
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    if (json) {
      output.errorJson({
        type: "UNKNOWN_ERROR",
        message,
      });
    } else {
      output.fail(message, { bugReport: true });
    }
  }
}
