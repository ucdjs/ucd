/* eslint-disable unused-imports/no-unused-vars */
import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
// import { createLocalUCDStore, createRemoteUCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { SHARED_FLAGS } from "./_shared";

export interface CLIStoreRepairCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    dryRun?: boolean;
    force?: boolean;
  }>>;
  versions: string[];
}

export async function runRepairStore({ flags }: CLIStoreRepairCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Repair an UCD Store",
      commandName: "ucd store repair",
      usage: "[versions...] [...flags]",
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
    dryRun: _dryRun,
    force: _force,
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

  // // eslint-disable-next-line no-console
  // console.log("Repairing UCD Store...");
}
