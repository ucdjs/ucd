import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { hasCapability } from "@ucdjs/fs-bridge";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

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
          ...SHARED_FLAGS,
          ["--concurrency", "Maximum concurrent downloads (default: 5)."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const {
    storeDir,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    lockfileOnly,
    force,
    concurrency = 5,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    // Mirror requires local store (needs write capability)
    if (remote) {
      output.error(red(`\n❌ Error: Mirror operation requires a local store directory.`));
      output.error("Use --store-dir to specify a local directory for mirroring.");
      return;
    }

    if (!storeDir) {
      output.error(red(`\n❌ Error: Store directory must be specified.`));
      return;
    }

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote: false,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      lockfileOnly: false,
    });

    // Check write capability
    if (!hasCapability(store.fs, "write")) {
      console.error(red(`\n❌ Error: Store does not have write capability required for sync operation.`));
      console.error("Please check the store configuration and try again.");
      return;
    }

    output.log("Starting mirror operation...");
    if (versions.length > 0) {
      output.log(`Mirroring ${versions.length} version(s): ${versions.join(", ")}`);
    } else {
      output.log("Mirroring all versions in lockfile...");
    }

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
      output.error(red(`\n❌ Error mirroring store:`));
      output.error(`  ${mirrorError.message}`);
      return;
    }

    if (!mirrorResult) {
      output.error(red(`\n❌ Error: Mirror operation returned no result.`));
      return;
    }

    // Display mirror results
    output.log(green("\n✓ Mirror operation completed successfully\n"));

    if (mirrorResult.summary) {
      const { counts, duration, storage, metrics } = mirrorResult.summary;
      output.log(`Summary:`);
      output.log(`  Versions processed: ${mirrorResult.versions.size}`);
      output.log(`  Files downloaded: ${green(String(counts.downloaded))}`);
      output.log(`  Files skipped: ${yellow(String(counts.skipped))}`);
      output.log(`  Files failed: ${counts.failed > 0 ? red(String(counts.failed)) : String(counts.failed)}`);
      output.log(`  Total size: ${storage.totalSize}`);
      output.log(`  Success rate: ${metrics.successRate.toFixed(1)}%`);
      output.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
      output.log("");
    }

    // Show per-version details
    for (const [version, report] of mirrorResult.versions) {
      output.log(`Version ${version}:`);
      output.log(`  Files: ${report.counts.downloaded} downloaded, ${report.counts.skipped} skipped`);
      if (report.counts.failed > 0) {
        output.log(`  ${red(`Failed: ${report.counts.failed}`)}`);
        // Show first few errors if any
        for (const error of report.errors.slice(0, 3)) {
          output.log(`    - ${error.file}: ${error.reason}`);
        }
        if (report.errors.length > 3) {
          output.log(`    ... and ${report.errors.length - 3} more errors`);
        }
      }
      output.log(`  Success rate: ${report.metrics.successRate.toFixed(1)}%`);
      if (report.metrics.cacheHitRate > 0) {
        output.log(`  Cache hit rate: ${report.metrics.cacheHitRate.toFixed(1)}%`);
      }
      output.log("");
    }

    if (lockfileOnly) {
      output.log(yellow("⚠ Note: Lockfile was not updated due to --lockfile-only flag."));
    }
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      output.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`\n❌ Error mirroring store:`));
    output.error(`  ${message}`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
