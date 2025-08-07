/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store";
import { red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, runVersionPrompt, SHARED_FLAGS } from "./_shared";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    dryRun?: boolean;
    force?: boolean;
  }>>;
  versions: string[];
}

export async function runInitStore({ flags, versions }: CLIStoreInitCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Initialize an UCD Store",
      commandName: "ucd store init",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--force", "Overwrite existing files if they already exist."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const {
    storeDir,
    force,
    remote,
    baseUrl,
    patterns,
    dryRun,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    let selectedVersions = versions;

    if (!selectedVersions || selectedVersions.length === 0) {
      const pickedVersions = await runVersionPrompt();

      if (pickedVersions.length === 0) {
        console.error("No versions selected. Operation cancelled.");
        return;
      }

      selectedVersions = pickedVersions;
    }

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      patterns,
      versions: selectedVersions,
    });

    await store.init({
      force,
      dryRun,
    });

    if (!store.initialized) {
      console.error(red(`\n❌ Error: Store initialization failed.`));
      console.error("Please check the store configuration and try again.");
      console.error("This output may help you debug the issue:");

      // TODO: utilize store status with a pretty printer.

      return;
    }

    if (dryRun) {
      console.info("Store initialized successfully in dry-run mode.");
      console.info("No files have been written to disk.");
    } else {
      console.info("Store initialized successfully.");
    }
  } catch (err) {
    if (err instanceof UCDStoreUnsupportedFeature) {
      console.error(red(`\n❌ Error: Unsupported feature:`));
      console.error(`  ${err.message}`);
      console.error("");
      console.error("This store does not support the init operation.");
      console.error("Please check the store capabilities or use a different store type.");
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error initializing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If the issue persists, consider running with --dry-run to see more details.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
