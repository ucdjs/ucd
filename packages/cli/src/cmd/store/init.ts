/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import fs from "node:fs/promises";
import { join } from "node:path";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, runVersionPrompt, SHARED_FLAGS } from "./_shared";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    dryRun?: boolean;
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
          ["--dry-run", "Show what would be done without making changes."],
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
    lockfileOnly,
    force,
    dryRun,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    // If lockfile-only mode, check if lockfile exists
    if (lockfileOnly && storeDir && !remote) {
      // Use the same relative path that getLockfilePath returns
      const lockfilePath = join(storeDir, ".ucd-store.lock");
      const lockfileExists = await fs.access(lockfilePath).then(() => true).catch(() => false);
      if (!lockfileExists) {
        console.error(red(`\n❌ Error: Lockfile not found at ${lockfilePath}`));
        console.error("Cannot proceed in --lockfile-only mode without an existing lockfile.");
        return;
      }
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

    // Create store with bootstrap enabled (unless lockfile-only)
    // The store creation will automatically bootstrap if needed
    await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      versions: selectedVersions,
      force,
      lockfileOnly,
    });

    if (dryRun) {
      console.info("Store initialization would be successful in dry-run mode.");
      console.info("No files have been written to disk.");
    } else {
      console.info("Store initialized successfully.");
      console.info(`Lockfile created with ${selectedVersions.length} version(s): ${selectedVersions.join(", ")}`);
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
