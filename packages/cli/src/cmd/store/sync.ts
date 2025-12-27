/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreSyncCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    concurrency?: number;
    removeUnavailable?: boolean;
    clean?: boolean;
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
          ...SHARED_FLAGS,
          ["--concurrency", "Maximum concurrent downloads (default: 5)."],
          ["--remove-unavailable", "Remove versions from lockfile that are not available in API."],
          ["--clean", "Remove orphaned files (files not in expected files list)."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const {
    storeDir,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    force,
    concurrency = 5,
    removeUnavailable,
    clean,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    // Sync requires local store (needs write capability)
    if (remote) {
      console.error(red(`\n❌ Error: Sync operation requires a local store directory.`));
      console.error("Use --store-dir to specify a local directory for syncing.");
      return;
    }

    if (!storeDir) {
      console.error(red(`\n❌ Error: Store directory must be specified.`));
      return;
    }

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      lockfileOnly: false,
    });

    // Check write capability
    if (!hasCapability(store.fs, "write")) {
      console.error(red(`\n❌ Error: Store does not have write capability required for sync operation.`));
      console.error("Please check the store configuration and try again.");
      return;
    }

    console.info("Starting sync operation...");
    if (versions.length > 0) {
      console.info(`Syncing ${versions.length} version(s): ${versions.join(", ")}`);
    } else {
      console.info("Syncing all versions in lockfile...");
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
      console.error(red(`\n❌ Error syncing store:`));
      console.error(`  ${syncError.message}`);
      return;
    }

    if (!syncResult) {
      console.error(red(`\n❌ Error: Sync operation returned no result.`));
      return;
    }

    // Display sync results
    console.info(green("\n✓ Sync completed successfully\n"));

    // Display lockfile update results
    if (syncResult.added.length > 0 || syncResult.removed.length > 0 || syncResult.unchanged.length > 0) {
      console.info("Lockfile updated:");
      if (syncResult.added.length > 0) {
        console.info(green(`  Added: ${syncResult.added.length} version(s): ${syncResult.added.join(", ")}`));
      }
      if (syncResult.removed.length > 0) {
        console.info(yellow(`  Removed: ${syncResult.removed.length} version(s): ${syncResult.removed.join(", ")}`));
      }
      if (syncResult.unchanged.length > 0) {
        console.info(`  Unchanged: ${syncResult.unchanged.length} version(s): ${syncResult.unchanged.join(", ")}`);
      }
      console.info("");
    }

    console.info(`Total versions in lockfile: ${syncResult.versions.length}`);

    if (syncResult.mirrorReport) {
      const report = syncResult.mirrorReport;
      if (report.summary) {
        const { counts, duration, storage } = report.summary;
        console.info(`Summary:`);
        console.info(`  Versions processed: ${report.versions.size}`);
        console.info(`  Files downloaded: ${green(String(counts.downloaded))}`);
        console.info(`  Files skipped: ${yellow(String(counts.skipped))}`);
        console.info(`  Files failed: ${counts.failed > 0 ? red(String(counts.failed)) : String(counts.failed)}`);
        console.info(`  Total size: ${storage.totalSize}`);
        console.info(`  Duration: ${(duration / 1000).toFixed(2)}s`);
        console.info("");
      }

      // Show per-version details
      for (const [version, versionReport] of report.versions) {
        console.info(`Version ${version}:`);
        console.info(`  Files: ${versionReport.counts.downloaded} downloaded, ${versionReport.counts.skipped} skipped`);
        if (versionReport.counts.failed > 0) {
          console.info(`  ${red(`Failed: ${versionReport.counts.failed}`)}`);
        }
        console.info("");
      }
    }

    // Show removed orphaned files if any
    if (syncResult.removedFiles.size > 0) {
      console.info(yellow("\n⚠ Orphaned files removed:\n"));
      for (const [version, removedFiles] of syncResult.removedFiles) {
        if (removedFiles.length > 0) {
          console.info(`Version ${version}:`);
          for (const filePath of removedFiles) {
            console.info(`  - ${filePath}`);
          }
          console.info("");
        }
      }
    } else if (clean) {
      console.info(green("\n✓ No orphaned files found\n"));
    }
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      console.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error syncing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
