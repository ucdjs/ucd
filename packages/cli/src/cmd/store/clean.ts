/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store/errors";
import { red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { SHARED_FLAGS } from "./_shared";

export interface CLIStoreCleanCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    dryRun?: boolean;
  }>>;
  versions?: string[];
}

export async function runCleanStore({ flags, versions }: CLIStoreCleanCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Clean an UCD Store",
      commandName: "ucd store clean",
      usage: "[versions...] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--dry-run", "Show what would be deleted without actually deleting."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!versions || versions.length === 0) {
    console.info("No specific versions provided. Cleaning all versions in the store.");
  }

  const {
    storeDir,
    dryRun,
    remote,
    baseUrl,
    patterns,
  } = flags;

  if (!remote && storeDir == null) {
    console.error("Error: --store-dir must be specified when not using a remote store.");
    console.error("Usage: ucd store clean [versions...] --store-dir <path>");
    return;
  }

  let store: UCDStore | null = null;
  if (remote) {
    store = await createHTTPUCDStore({
      baseUrl,
      globalFilters: patterns,
    });
  } else {
    store = await createNodeUCDStore({
      basePath: storeDir,
      baseUrl,
      globalFilters: patterns,
    });
  }

  if (store == null) {
    console.error("Error: Failed to create UCD store.");
    return;
  }

  try {
    const result = await store.clean({
      dryRun: !!dryRun,
      versions,
    });

    if (dryRun) {
      console.log("\n🔍 Dry run - showing what would be deleted:\n");
    } else {
      console.log("\n🗑️  Cleaning store:\n");
    }

    if (result.locatedFiles && result.locatedFiles.length > 0) {
      console.log("📦 Files located for removal:");
      result.locatedFiles.forEach((filePath) => {
        const status = dryRun ? "would be deleted" : "processed";
        console.log(`  • ${filePath} - ${status}`);
      });
    } else {
      console.log("✨ No files found to clean.");
    }

    if (!dryRun && result.removedFiles && result.removedFiles.length > 0) {
      console.log("\n✅ Successfully removed:");
      result.removedFiles.forEach((filePath) => {
        console.log(`  • ${filePath}`);
      });
    }

    if (result.failedRemovals && result.failedRemovals.length > 0) {
      console.log("\n❌ Failed to remove:");
      result.failedRemovals.forEach((failure) => {
        console.log(`  • ${failure.filePath} - ${failure.error}`);
      });
    }

    const totalLocated = result.locatedFiles?.length || 0;
    const totalRemoved = result.removedFiles?.length || 0;
    const totalFailed = result.failedRemovals?.length || 0;

    console.log(`\n📊 Summary:`);
    console.log(`  • Located: ${totalLocated} file${totalLocated !== 1 ? "s" : ""}`);
    if (!dryRun) {
      console.log(`  • Removed: ${totalRemoved} file${totalRemoved !== 1 ? "s" : ""}`);
    }
    if (totalFailed > 0) {
      console.log(`  • Failed: ${totalFailed} file${totalFailed !== 1 ? "s" : ""}`);
    }

    if (dryRun) {
      console.log("\n💡 Run without --dry-run to actually delete the files.");
    } else if (totalRemoved > 0) {
      console.log("\n✅ Store cleaning completed successfully!");
    }
  } catch (err) {
    if (err instanceof UCDStoreUnsupportedFeature) {
      console.error(red(`\n❌ Error: Unsupported feature:`));
      console.error(`  ${err.message}`);
      console.error("");
      console.error("This store does not support the clean operation.");
      console.error("Please check the store capabilities or use a different store type.");
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error cleaning store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If the issue persists, consider running with --dry-run to see more details.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
