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
  list,
  output,
  red,
  yellow,
} from "../../output";
import { assertLocalStore, createStoreFromFlags, LOCAL_STORE_FLAGS, SHARED_FLAGS } from "./_shared";

export interface CLIStoreMirrorCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    concurrency?: number;
  }>>;
  versions: string[];
}

export async function runMirrorStore({ flags, versions }: CLIStoreMirrorCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Mirror Unicode data files to local storage",
      commandName: "ucd store mirror",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...LOCAL_STORE_FLAGS,
          ...SHARED_FLAGS,
          ["--concurrency", "Maximum concurrent downloads (default: 5)."],
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
    concurrency = 5,
  } = flags;

  try {
    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      requireExistingStore: true,
      // Mirror should use "merge" strategy - we're mirroring specific versions
      // from an existing lockfile, not replacing the entire version set
      versionStrategy: "merge",
    });

    header("Mirror Operation");

    keyValue("Store Path", storeDir, { valueColor: cyan });
    if (versions.length > 0) {
      keyValue("Versions", versions.map((v) => cyan(v)).join(", "));
    } else {
      keyValue("Versions", "all versions in lockfile");
    }

    blankLine();

    const [mirrorResult, mirrorError] = await store.mirror({
      versions: versions.length > 0 ? versions : undefined,
      force,
      concurrency,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (mirrorError) {
      output.fail("Mirror operation failed", {
        details: [mirrorError.message],
      });
      return;
    }

    if (!mirrorResult) {
      output.fail("Mirror operation returned no result");
      return;
    }

    output.success("Mirror operation completed");

    if (mirrorResult.summary) {
      const { counts, duration, storage, metrics } = mirrorResult.summary;

      header("Summary");

      keyValue("Versions", String(mirrorResult.versions.size));
      keyValue("Downloaded", `${green(String(counts.success))} files`);
      keyValue("Skipped", `${yellow(String(counts.skipped))} files`);
      if (counts.failed > 0) {
        keyValue("Failed", `${red(String(counts.failed))} files`);
      }
      keyValue("Total Size", storage.totalSize);
      keyValue("Success Rate", `${metrics.successRate.toFixed(1)}%`);
      keyValue("Duration", formatDuration(duration));
    }

    // Show per-version details if multiple versions
    if (mirrorResult.versions.size > 1) {
      header("Version Details");

      for (const [version, report] of mirrorResult.versions) {
        output.log(`  ${cyan(version)}`);
        output.log(`    Downloaded: ${green(String(report.counts.success))}, Skipped: ${yellow(String(report.counts.skipped))}`);

        if (report.counts.failed > 0) {
          output.log(`    ${red(`Failed: ${report.counts.failed}`)}`);
          const errorMessages = report.errors.slice(0, 3).map((e) => `${e.filePath}: ${e.reason}`);
          list(errorMessages, { indent: 4, prefix: "-" });
          if (report.errors.length > 3) {
            output.log(`      ... and ${report.errors.length - 3} more errors`);
          }
        }
        blankLine();
      }
    }

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
