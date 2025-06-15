import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import { createUCDStore, type UCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { type CLIStoreCmdSharedFlags, SHARED_FLAGS } from "./_shared";

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
    proxyUrl,
    patterns,
  } = flags;

  let store: UCDStore | null = null;
  if (remote) {
    store = await createUCDStore("remote", {
      baseUrl,
      proxyUrl,
      filters: patterns,
    });
  } else {
    store = await createUCDStore("local", {
      basePath: storeDir,
      baseUrl,
      proxyUrl,
      filters: patterns,
    });
  }

  if (store == null) {
    console.error("Error: Failed to create UCD store.");
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Repairing UCD Store...");
}
