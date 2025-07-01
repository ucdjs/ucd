/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createLocalUCDStore, createRemoteUCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { SHARED_FLAGS } from "./_shared";

export interface CLIStoreCleanCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    dryRun?: boolean;
  }>>;
}

export async function runCleanStore({ flags }: CLIStoreCleanCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Clean an UCD Store",
      commandName: "ucd store clean",
      usage: "[...flags]",
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

  const {
    storeDir,
    dryRun,
    remote,
    baseUrl,
    patterns,
  } = flags;

  let store: UCDStore | null = null;
  if (remote) {
    store = await createRemoteUCDStore({
      baseUrl,
      globalFilters: patterns,
    });
  } else {
    store = await createLocalUCDStore({
      basePath: storeDir,
      baseUrl,
      globalFilters: patterns,
    });
  }

  if (store == null) {
    console.error("Error: Failed to create UCD store.");
    return;
  }

  if (dryRun) {
    const filesToDelete = await store.getAllFiles();
    if (filesToDelete.length === 0) {
      console.log("No files to delete.");
    } else {
      console.log("Files that would be deleted:");
      filesToDelete.forEach((file) => console.log(`- ${file}`));
    }
    return;
  }

  const result = await store.clean();

  if (!result.success) {
    console.error("Error cleaning UCD Store:", result.error);
    return;
  }

  console.log("UCD Store cleaned successfully.");
  console.log(`Deleted ${result.deletedCount} files.`);
}
