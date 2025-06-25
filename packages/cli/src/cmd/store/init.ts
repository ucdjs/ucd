import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createLocalUCDStore, createRemoteUCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { SHARED_FLAGS } from "./_shared";

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
      usage: "<versions...> [...flags]",
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

  if (!versions || versions.length === 0) {
    console.error("Error: At least one Unicode version must be specified.");
    console.error("Usage: ucd store init <versions...>");
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
    store = await createRemoteUCDStore({
      baseUrl,
      proxyUrl,
      globalFilters: patterns,
    });
  } else {
    store = await createLocalUCDStore({
      basePath: storeDir,
      baseUrl,
      proxyUrl,
      globalFilters: patterns,
    });
  }

  if (store == null) {
    console.error("Error: Failed to create UCD store.");
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Initializing UCD Store...");
}
