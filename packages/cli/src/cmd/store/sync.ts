/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreSyncCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    strategy?: "add" | "update";
    mirror?: boolean;
  }>>;
  versions: string[];
}

export async function runSyncStore({ flags, versions }: CLIStoreSyncCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Sync UCD Store lockfile with available versions",
      commandName: "ucd store sync",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--strategy", "Sync strategy: 'add' (default) to add new versions, 'update' to add new and remove unavailable."],
          ["--mirror", "Automatically mirror files after syncing versions."],
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
    lockfileOnly,
    force,
    strategy = "add",
    mirror: shouldMirror,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      lockfileOnly,
    });

    if (lockfileOnly) {
      console.info(yellow("⚠ Read-only mode: Showing what would change without updating lockfile."));
    }

    const [syncResult, syncError] = await store.sync({
      strategy: force ? "update" : strategy,
      mirror: shouldMirror,
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

    if (syncResult.added.length > 0) {
      console.info(green(`Added ${syncResult.added.length} version(s):`));
      for (const version of syncResult.added) {
        console.info(`  + ${version}`);
      }
      console.info("");
    }

    if (syncResult.removed.length > 0) {
      console.info(yellow(`Removed ${syncResult.removed.length} version(s):`));
      for (const version of syncResult.removed) {
        console.info(`  - ${version}`);
      }
      console.info("");
    }

    if (syncResult.unchanged.length > 0) {
      console.info(`Unchanged ${syncResult.unchanged.length} version(s):`);
      for (const version of syncResult.unchanged) {
        console.info(`  = ${version}`);
      }
      console.info("");
    }

    console.info(`Total versions in lockfile: ${syncResult.versions.length}`);

    if (shouldMirror && syncResult.mirrorReport) {
      console.info(green("\n✓ Mirroring completed\n"));
      const report = syncResult.mirrorReport;
      console.info(`Mirrored ${report.versions.size} version(s)`);
      if (report.summary) {
        console.info(`  Files downloaded: ${report.summary.counts.downloaded}`);
        console.info(`  Files skipped: ${report.summary.counts.skipped}`);
        console.info(`  Total size: ${(report.summary.counts.totalSize / 1024 / 1024).toFixed(2)} MB`);
      }
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

