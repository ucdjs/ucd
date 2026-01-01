import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreCompareCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
    skipHashes?: boolean;
    concurrency?: string;
  }>>;
  from?: string;
  to?: string;
}

export async function runCompareStore({ flags, from, to }: CLIStoreCompareCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Compare Two Versions in UCD Store",
      commandName: "ucd store compare",
      usage: "<from> <to> [...flags]",
      tables: {
        Arguments: [
          ["from", "Version to compare from."],
          ["to", "Version to compare to."],
        ],
        Flags: [
          ...SHARED_FLAGS,
          ["--skip-hashes", "Skip file hash comparison (faster, but won't detect content changes)."],
          ["--concurrency", "Number of concurrent file reads for hashing. Defaults to 5."],
          ["--json", "Output comparison results in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  assertRemoteOrStoreDir(flags);

  if (!from || !to) {
    output.error(red("\n❌ Error: Both <from> and <to> versions must be specified."));
    output.log(`Usage: ucd store compare <from> <to> [flags]`);
    return;
  }

  // Ensure that the from and to versions are not the same
  if (from === to) {
    output.error(red("\n❌ Error: <from> and <to> versions must be different."));
    return;
  }

  // TODO:
  // Should we handle the cases where from is newer than to?
  // For now, we just compare as-is.
  //
  // But we could either throw an error, or swap them and indicate that the comparison is reversed.
  // If we swap them, we need to tell the user that the comparison is reversed.

  const {
    storeDir,
    json,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    skipHashes,
    concurrency,
  } = flags;

  try {
    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      exclude: excludePatterns,
      requireExistingStore: true,
    });

    const [comparison, compareError] = await store.compare({
      from,
      to,
      includeFileHashes: !skipHashes,
      concurrency: concurrency ? Number.parseInt(concurrency, 10) : undefined,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (compareError != null) {
      output.error(red(`\n❌ Error comparing versions:`));
      output.error(`  ${compareError.message}`);
      return;
    }

    if (!comparison) {
      output.error(red(`\n❌ Error: Comparison operation returned no result.`));
      return;
    }

    if (json) {
      output.json({
        from: comparison.from,
        to: comparison.to,
        added: comparison.added,
        removed: comparison.removed,
        modified: comparison.modified,
        unchanged: comparison.unchanged,
        changes: comparison.changes,
      });
      return;
    }

    // Human-readable output
    output.log(`\n📊 Comparison: ${comparison.from} → ${comparison.to}\n`);

    const totalAdded = comparison.added.length;
    const totalRemoved = comparison.removed.length;
    const totalModified = comparison.modified.length;
    const totalUnchanged = comparison.unchanged;

    output.log(`📁 Summary:`);
    output.log(`  Added:     ${totalAdded}`);
    output.log(`  Removed:   ${totalRemoved}`);
    output.log(`  Modified:  ${totalModified}`);
    output.log(`  Unchanged: ${totalUnchanged}`);
    output.log("");

    if (totalAdded > 0) {
      output.log(green(`✅ Added files:`));
      if (comparison.added.length <= 10) {
        comparison.added.forEach((file) => {
          output.log(`   + ${file}`);
        });
      } else {
        comparison.added.slice(0, 10).forEach((file) => {
          output.log(`   + ${file}`);
        });
        output.log(`   + ... and ${comparison.added.length - 10} more`);
      }
      output.log("");
    }

    if (totalRemoved > 0) {
      output.log(red(`❌ Removed files:`));
      if (comparison.removed.length <= 10) {
        comparison.removed.forEach((file) => {
          output.log(`   - ${file}`);
        });
      } else {
        comparison.removed.slice(0, 10).forEach((file) => {
          output.log(`   - ${file}`);
        });
        output.log(`   - ... and ${comparison.removed.length - 10} more`);
      }
      output.log("");
    }

    if (totalModified > 0) {
      output.log(yellow(`🔄 Modified files:`));
      if (comparison.modified.length <= 10) {
        comparison.modified.forEach((file) => {
          output.log(`   ~ ${file}`);
        });
      } else {
        comparison.modified.slice(0, 10).forEach((file) => {
          output.log(`   ~ ${file}`);
        });
        output.log(`   ~ ... and ${comparison.modified.length - 10} more`);
      }
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

    output.error(red(`\n❌ Error comparing versions:`));
    output.error(`  ${message}`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
