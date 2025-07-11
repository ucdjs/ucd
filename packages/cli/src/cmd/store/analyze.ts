/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store/errors";
import { green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, SHARED_FLAGS } from "./_shared";

export interface CLIStoreStatusCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
    checkOrphaned?: boolean;
  }>>;
  versions?: string[];
}

export async function runAnalyzeStore({ flags, versions }: CLIStoreStatusCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Show UCD Store Status",
      commandName: "ucd store status",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--check-orphaned", "Check for orphaned files in the store."],
          ["--json", "Output status information in JSON format."],
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
    json,
    remote,
    baseUrl,
    patterns,
    checkOrphaned,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

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

    const result = await store.analyze({
      checkOrphaned: !!checkOrphaned,
      versions: versions || [],
    });

    if (json) {
      console.info(JSON.stringify(result, null, 2));
      return;
    }

    if (result.storeHealth === "corrupted") {
      console.error(red(`\n❌ Error: Store is corrupted.`));
      console.error("Please run `ucd store repair` to fix the store.");
      return;
    } else if (result.storeHealth === "needs_cleanup") {
      console.warn(red(`\n⚠️  Warning: Store needs cleanup.`));
      console.warn("Consider running `ucd store clean` to remove orphaned or outdated files.");
    } else if (result.storeHealth === "healthy") {
      console.info(green(`\n✅ Store is healthy.`));
    }

    for (const { version, fileCount, isComplete, missingFiles, orphanedFiles, totalFileCount } of result.versions) {
      console.info(`Version: ${version}`);
      if (isComplete) {
        console.info(`  Status: ${green("complete")}`);
      } else {
        console.warn(`  Status: ${red("incomplete")}`);
      }
      console.info(`  Files: ${fileCount}`);
      if (missingFiles && missingFiles.length > 0) {
        console.warn(`  Missing files: ${missingFiles.length}`);
      }
      if (orphanedFiles && orphanedFiles.length > 0) {
        console.warn(`  Orphaned files: ${orphanedFiles.length}`);
      }

      if (totalFileCount) {
        console.info(`  Total files expected: ${totalFileCount}`);
      }
    }
  } catch (err) {
    if (err instanceof UCDStoreUnsupportedFeature) {
      console.error(red(`\n❌ Error: Unsupported feature:`));
      console.error(`  ${err.message}`);
      console.error("");
      console.error("This store does not support the analyze operation.");
      console.error("Please check the store capabilities or use a different store type.");
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error analyzing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If the issue persists, consider running with --dry-run to see more details.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
