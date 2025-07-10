/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store/errors";
import { red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, SHARED_FLAGS } from "./_shared";

export interface CLIStoreStatusCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
  }>>;
}

export async function runAnalyzeStore({ flags }: CLIStoreStatusCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Show UCD Store Status",
      commandName: "ucd store status",
      usage: "[...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--json", "Output status information in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const {
    storeDir,
    json,
    remote,
    baseUrl,
    patterns,
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

    const result = await store.analyze();

    if (!result.success) {
      console.error("Error: Failed to analyze UCD store.");
      console.error(result.error);
      return;
    }

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("UCD Store Status:");
      console.log(`Total files: ${result.totalFiles}`);
      for (const [version, info] of Object.entries(result.versions)) {
        console.log(`Version: ${version}`);
        console.log(`  Total files: ${info.fileCount}`);
        console.log(`  Is Complete: ${info.isComplete}`);
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
