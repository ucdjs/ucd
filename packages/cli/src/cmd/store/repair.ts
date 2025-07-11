import type { Prettify } from "@luxass/utils";
import type { UCDStore } from "@ucdjs/ucd-store";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { UCDStoreUnsupportedFeature } from "@ucdjs/ucd-store/errors";
import { red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

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
    dryRun,
    force: _force,
    remote,
    baseUrl,
    patterns,
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

    // eslint-disable-next-line no-console
    console.log("Repairing UCD Store...");

    await store.repair({
      dryRun: !!dryRun,
    });

    // eslint-disable-next-line no-console
    console.info("UCD Store repair completed successfully.");
  } catch (err) {
    if (err instanceof UCDStoreUnsupportedFeature) {
      console.error(red(`\n❌ Error: Unsupported feature:`));
      console.error(`  ${err.message}`);
      console.error("");
      console.error("This store does not support the repair operation.");
      console.error("Please check the store capabilities or use a different store type.");
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error repairing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If the issue persists, consider running with --dry-run to see more details.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
