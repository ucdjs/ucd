/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store";
import { green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreAnalyzeCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
    checkOrphaned?: boolean;
  }>>;
  versions?: string[];
}

export async function runAnalyzeStore({ flags, versions }: CLIStoreAnalyzeCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Analyze UCD Store",
      commandName: "ucd store analyze",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--check-orphaned", "Check for orphaned files in the store."],
          ["--json", "Output analyze information in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!versions || versions.length === 0) {
    console.info("No specific versions provided. Analyzing all versions in the store.");
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

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      patterns,
    });

    if (store == null) {
      console.error("Error: Failed to create UCD store.");
      return;
    }

    const result = await store.analyze({
      checkOrphaned: !!checkOrphaned,
      versions: versions || [],
    });

    if (!result.success) {
      console.error(red(`\n❌ Error analyzing store:`));
      for (const error of result.errors) {
        console.error(`  ${error.message}`);
      }
      return;
    }

    if (json) {
      console.info(JSON.stringify(result, null, 2));
      return;
    }

    for (const { version, fileCount, isComplete, missingFiles, orphanedFiles, expectedFileCount } of result.data) {
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

      if (expectedFileCount) {
        console.info(`  Total files expected: ${expectedFileCount}`);
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
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
