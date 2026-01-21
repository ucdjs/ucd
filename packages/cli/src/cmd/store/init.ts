import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import type { Prettify } from "@luxass/utils";
import { tryOr } from "@ucdjs-internal/shared";
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
import {
  assertLocalStore,
  createStoreFromFlags,
  LOCAL_STORE_FLAGS,
  runVersionPrompt,
  SHARED_FLAGS,
} from "./_shared";

export interface CLIStoreInitCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
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
          ...LOCAL_STORE_FLAGS,
          ...SHARED_FLAGS,
          ["--json", "Output initialization results in JSON format."],
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
    json,
  } = flags;

  let selectedVersions = versions;
  if (!selectedVersions || selectedVersions.length === 0) {
    const pickedVersions = await tryOr({
      try: runVersionPrompt(),
      err: () => {
        if (json) {
          output.errorJson({
            type: "PROMPT_CANCELLED",
            message: "Version selection cancelled",
          });
        } else {
          output.warning("Version selection cancelled.");
        }
        return [];
      },
    });

    if (pickedVersions.length === 0) {
      if (json) {
        output.errorJson({
          type: "NO_VERSIONS_SELECTED",
          message: "No versions selected",
        });
      } else {
        output.warning("No versions selected. Operation cancelled.");
      }
      return;
    }

    selectedVersions = pickedVersions;
  }

  // Create store (this validates versions)
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

  // Print header AFTER validation passes
  if (!json) {
    header("UCD Store Initialization");

    keyValue("Store Path", storeDir, { valueColor: cyan });
    keyValue("Versions", selectedVersions.map((v) => cyan(v)).join(", "));

    blankLine();
    output.success("Lockfile created");
  }

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
    if (json) {
      output.errorJson({
        type: "MIRROR_FAILED",
        message: "Mirror failed",
        details: { reason: mirrorError.message, lockfileCreated: true },
      });
    } else {
      output.fail("Mirror failed", {
        details: [mirrorError.message, "Lockfile was created, but files were not downloaded."],
      });
    }
    return;
  }

  if (!mirrorResult) {
    if (json) {
      output.errorJson({
        type: "NO_MIRROR_RESULT",
        message: "Mirror returned no result",
        details: { lockfileCreated: true },
      });
    } else {
      output.fail("Mirror returned no result", {
        details: ["Lockfile was created, but files were not downloaded."],
      });
    }
    return;
  }

  if (json) {
    const jsonOutput = {
      success: true,
      storeDir,
      versions: selectedVersions,
      summary: mirrorResult.summary
        ? {
            versionsCount: mirrorResult.versions.size,
            downloaded: mirrorResult.summary.counts.success,
            skipped: mirrorResult.summary.counts.skipped,
            failed: mirrorResult.summary.counts.failed,
            totalSize: mirrorResult.summary.storage.totalSize,
            duration: mirrorResult.summary.duration,
          }
        : undefined,
    };
    output.json(jsonOutput);
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
}
