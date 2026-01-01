import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreAnalyzeCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
    checkOrphaned?: boolean;
  }>>;
  versions: string[];
}

export async function runAnalyzeStore({ flags, versions }: CLIStoreAnalyzeCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Analyze UCD Store",
      commandName: "ucd store analyze",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--check-orphaned", "Check for orphaned files in the store."],
          ["--json", "Output analyze information in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!versions || versions.length === 0) {
    output.log("No specific versions provided. Analyzing all versions in the store.");
  }

  assertRemoteOrStoreDir(flags);

  const {
    storeDir,
    json,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
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

    const [analyzeData, analyzeError] = await store.analyze({
      versions: versions.length > 0 ? versions : undefined,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (analyzeError != null) {
      output.error(red(`\n❌ Error analyzing store:`));
      output.error(`  ${analyzeError.message}`);
      return;
    }

    if (!analyzeData) {
      output.error(red(`\n❌ Error: Analyze operation returned no result.`));
      return;
    }

    if (json) {
      // Convert Map to object for JSON serialization
      const analyzeDataObj = Object.fromEntries(
        Array.from(analyzeData.entries()).map(([version, report]) => [
          version,
          {
            ...report,
            files: {
              ...report.files,
              missing: Array.from(report.files.missing || []),
              orphaned: Array.from(report.files.orphaned || []),
            },
          },
        ]),
      );
      output.json(analyzeDataObj);
      return;
    }

    for (const [version, report] of analyzeData.entries()) {
      output.log(`Version: ${version}`);
      if (report.isComplete) {
        output.log(`  Status: ${green("complete")}`);
      } else {
        output.warn(`  Status: ${red("incomplete")}`);
      }
      output.log(`  Files: ${report.counts.present}`);
      if (report.files.missing && report.files.missing.length > 0) {
        output.warn(`  Missing files: ${report.files.missing.length}`);
      }
      if (report.files.orphaned && report.files.orphaned.length > 0) {
        output.warn(`  Orphaned files: ${report.files.orphaned.length}`);
      }

      if (report.counts.expected) {
        output.log(`  Total files expected: ${report.counts.expected}`);
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

    output.error(red(`\n❌ Error analyzing store:`));
    output.error(`  ${message}`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
