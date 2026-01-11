import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { printHelp } from "../../cli-utils";
import {
  blankLine,
  cyan,
  formatDuration,
  green,
  header,
  keyValue,
  output,
  red,
  yellow,
} from "../../output";
import { assertLocalStore, createStoreFromFlags, LOCAL_STORE_FLAGS, runVersionPrompt, SHARED_FLAGS } from "./_shared";

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
          ...LOCAL_STORE_FLAGS,
          ...SHARED_FLAGS,
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  assertLocalStore(flags);

  const {
    storeDir,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    force,
  } = flags;

  try {
    let selectedVersions = versions;
    if (!selectedVersions || selectedVersions.length === 0) {
      const pickedVersions = await runVersionPrompt();

      if (pickedVersions.length === 0) {
        output.warning("No versions selected. Operation cancelled.");
        return;
      }

      selectedVersions = pickedVersions;
    }

    header("UCD Store Initialization");

    keyValue("Store Path", storeDir, { valueColor: cyan });
    keyValue("Versions", selectedVersions.map((v) => cyan(v)).join(", "));

    blankLine();

    // Create store
    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions: selectedVersions,
      force,
      requireExistingStore: false,
    });
    output.success("Lockfile created");

    // Mirror files
    const [mirrorResult, mirrorError] = await store.mirror({
      versions: selectedVersions,
      force,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (mirrorError) {
      output.fail("Mirror failed", {
        details: [mirrorError.message, "Lockfile was created, but files were not downloaded."],
      });
      return;
    }

    if (!mirrorResult) {
      output.fail("Mirror returned no result", {
        details: ["Lockfile was created, but files were not downloaded."],
      });
      return;
    }

    output.success("Files downloaded");

    // Summary
    if (mirrorResult.summary) {
      const { counts, duration, storage } = mirrorResult.summary;

      header("Summary");

      keyValue("Versions", String(mirrorResult.versions.size));
      keyValue("Downloaded", `${green(String(counts.success))} files`);
      if (counts.skipped > 0) {
        keyValue("Skipped", `${yellow(String(counts.skipped))} files`);
      }
      if (counts.failed > 0) {
        keyValue("Failed", `${red(String(counts.failed))} files`);
      }
      keyValue("Total Size", storage.totalSize);
      keyValue("Duration", formatDuration(duration));
    }

    blankLine();
    output.success("Store initialized successfully");
    blankLine();
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      output.fail(err.message);
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.fail(message, { bugReport: true });
  }
}
