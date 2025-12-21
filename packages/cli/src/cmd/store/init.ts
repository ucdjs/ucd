/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, runVersionPrompt, SHARED_FLAGS } from "./_shared";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags>>;
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
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    // Init requires local store (needs write capability)
    if (remote) {
      console.error(red(`\n❌ Error: Init operation requires a local store directory.`));
      console.error("Use --store-dir to specify a local directory for initialization.");
      return;
    }

    if (!storeDir) {
      console.error(red(`\n❌ Error: Store directory must be specified.`));
      return;
    }

    let selectedVersions = versions;

    if (!selectedVersions || selectedVersions.length === 0) {
      const pickedVersions = await runVersionPrompt();

      if (pickedVersions.length === 0) {
        console.error("No versions selected. Operation cancelled.");
        return;
      }

      selectedVersions = pickedVersions;
    }

    // Create store with bootstrap enabled
    // The store creation will automatically bootstrap if needed
    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions: selectedVersions,
      force,
      lockfileOnly: false,
    });

    // Check write capability
    // assertWriteCapability(store);

    console.info("Store initialized successfully.");
    console.info(`Lockfile created with ${selectedVersions.length} version(s): ${selectedVersions.join(", ")}`);

    // Automatically mirror files after lockfile creation
    console.info("\nStarting mirror operation...");
    const [mirrorResult, mirrorError] = await store.mirror({
      versions: selectedVersions,
      force,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (mirrorError) {
      console.error(red(`\n⚠ Warning: Mirror operation failed:`));
      console.error(`  ${mirrorError.message}`);
      console.error("Lockfile was created successfully, but files were not downloaded.");
      return;
    }

    if (!mirrorResult) {
      console.error(red(`\n⚠ Warning: Mirror operation returned no result.`));
      console.error("Lockfile was created successfully, but files were not downloaded.");
      return;
    }

    // Display mirror results
    console.info(green("\n✓ Mirror operation completed successfully\n"));

    if (mirrorResult.summary) {
      const { counts, duration, storage } = mirrorResult.summary;
      console.info(`Summary:`);
      console.info(`  Versions processed: ${mirrorResult.versions.size}`);
      console.info(`  Files downloaded: ${green(String(counts.downloaded))}`);
      console.info(`  Files skipped: ${yellow(String(counts.skipped))}`);
      console.info(`  Files failed: ${counts.failed > 0 ? red(String(counts.failed)) : String(counts.failed)}`);
      console.info(`  Total size: ${storage.totalSize}`);
      console.info(`  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.info("");
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

    console.error(red(`\n❌ Error initializing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
