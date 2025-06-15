import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import { createUCDStore, type UCDStore } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import { type CLIStoreCmdSharedFlags, SHARED_FLAGS } from "./_shared";

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
  console.log("Initializing UCD Store...");
}
