/* eslint-disable unused-imports/no-unused-vars */

import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
// import { createLocalUCDStore, createRemoteUCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { SHARED_FLAGS } from "./_shared";

export interface CLIStoreStatusCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
  }>>;
}

export async function runStatusStore({ flags }: CLIStoreStatusCmdOptions) {
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

  // let store: UCDStore | null = null;
  // if (remote) {
  //   store = await createRemoteUCDStore({
  //     baseUrl,
  //     globalFilters: patterns,
  //   });
  // } else {
  //   store = await createLocalUCDStore({
  //     basePath: storeDir,
  //     baseUrl,
  //     globalFilters: patterns,
  //   });
  // }

  // if (store == null) {
  //   console.error("Error: Failed to create UCD store.");
  //   return;
  // }

  // const result = await store.analyze();

  // if (!result.success) {
  //   console.error("Error: Failed to analyze UCD store.");
  //   console.error(result.error);
  //   return;
  // }

  // if (json) {
  //   console.log(JSON.stringify(result, null, 2));
  // } else {
  //   console.log("UCD Store Status:");
  //   console.log(`Total files: ${result.totalFiles}`);
  //   for (const [version, info] of Object.entries(result.versions)) {
  //     console.log(`Version: ${version}`);
  //     console.log(`  Total files: ${info.fileCount}`);
  //     console.log(`  Is Complete: ${info.isComplete}`);
  //   }
  // }
}
