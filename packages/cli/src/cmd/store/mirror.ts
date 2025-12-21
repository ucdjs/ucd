/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
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

    if (remote) {
      console.error(red(`\n❌ Error: Mirror operation requires a local store directory.`));
      console.error("Use --store-dir to specify a local directory for mirroring.");
      return;
    }

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      exclude: excludePatterns,
      versions,
      force,
      lockfileOnly,
    });

    if (lockfileOnly) {
      console.info(yellow("⚠ Read-only mode: Files will be downloaded but lockfile will not be updated."));
    }

    console.info("Starting mirror operation...");
    if (versions.length > 0) {
      console.info(`Mirroring ${versions.length} version(s): ${versions.join(", ")}`);
    } else {
      console.info("Mirroring all versions in lockfile...");
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
      console.error(red(`\n❌ Error mirroring store:`));
      console.error(`  ${mirrorError.message}`);
      return;
    }

    if (!mirrorResult) {
      console.error(red(`\n❌ Error: Mirror operation returned no result.`));
      return;
    }

    // Display mirror results
    console.info(green("\n✓ Mirror operation completed successfully\n"));

    if (mirrorResult.summary) {
      const { counts, duration, storage } = mirrorResult.summary;
      console.info(`Summary:`);
      console.info(`  Versions processed: ${mirrorResult.versions.size}`);
      console.info(`  Files downloaded: ${green(String(counts.downloaded))}`);
      console.info(`  Files skipped: ${yellow(String(counts.skipped))}`);
      console.info(`  Files failed: ${counts.failed > 0 ? red(String(counts.failed)) : String(counts.failed)}`);
      console.info(`  Total size: ${storage.totalSize}`);
      console.info(`  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.info("");
    }

    // Show per-version details
    for (const [version, report] of mirrorResult.versions) {
      console.info(`Version ${version}:`);
      console.info(`  Files: ${report.counts.downloaded} downloaded, ${report.counts.skipped} skipped`);
      if (report.counts.failed > 0) {
        console.info(`  ${red(`Failed: ${report.counts.failed}`)}`);
      }
      if (report.storage) {
        console.info(`  Size: ${report.storage.totalSize}`);
      }
      console.info("");
    }

    if (lockfileOnly) {
      console.info(yellow("⚠ Note: Lockfile was not updated due to --lockfile-only flag."));
    }
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      console.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error mirroring store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
