import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { spinner } from "@clack/prompts";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { cyan, dim, green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";
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
    output.log("");
    output.log(cyan("UCD Store Initialization"));
    output.log("");

    let selectedVersions = versions;
    if (!selectedVersions || selectedVersions.length === 0) {
      const pickedVersions = await runVersionPrompt();

      if (pickedVersions.length === 0) {
        output.warn(yellow("No versions selected. Operation cancelled."));
        return;
      }

      selectedVersions = pickedVersions;
    }

    output.log(`Store path: ${cyan(storeDir)}`);
    output.log(`Versions:   ${selectedVersions.map((v) => cyan(v)).join(", ")}`);
    output.log("");

    const s = spinner();

    // Create store
    s.start("Creating lockfile...");
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
    s.stop(green("✓ Lockfile created"));

    // Mirror files
    s.start("Downloading Unicode data files...");
    const [mirrorResult, mirrorError] = await store.mirror({
      versions: selectedVersions,
      force,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (mirrorError) {
      s.stop(red("✗ Mirror failed"));
      output.error(mirrorError.message);
      output.warn(yellow("Lockfile was created, but files were not downloaded."));
      return;
    }

    if (!mirrorResult) {
      s.stop(red("✗ Mirror returned no result"));
      output.warn(yellow("Lockfile was created, but files were not downloaded."));
      return;
    }

    s.stop(green("✓ Files downloaded"));

    // Summary
    if (mirrorResult.summary) {
      const { counts, duration, storage } = mirrorResult.summary;

      output.log("");
      output.log(dim("Summary"));
      output.log(`  Versions:   ${mirrorResult.versions.size}`);
      output.log(`  Downloaded: ${green(String(counts.downloaded))} files`);
      if (counts.skipped > 0) {
        output.log(`  Skipped:    ${yellow(String(counts.skipped))} files`);
      }
      if (counts.failed > 0) {
        output.log(`  Failed:     ${red(String(counts.failed))} files`);
      }
      output.log(`  Total size: ${storage.totalSize}`);
      output.log(`  Duration:   ${(duration / 1000).toFixed(2)}s`);
    }

    output.log("");
    output.log(green("Store initialized successfully!"));
    output.log("");
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      output.error(red(`Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`Error: ${message}`));
    output.log(dim("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues"));
  }
}
