import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { CLIError } from "../../errors";
import { printHelp } from "../../cli-utils";
import { green, output, red } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, REMOTE_CAPABLE_FLAGS, SHARED_FLAGS } from "./_shared";

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
          ...REMOTE_CAPABLE_FLAGS,
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

  const {
    storeDir,
    json,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

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
      // Convert Map to plain object for JSON serialization
      const analyzeDataObj = {
        ...analyzeData,
        versions: Object.fromEntries(
          Array.from(analyzeData.versions.entries()).map(([version, report]) => [
            version,
            {
              ...report,
              files: {
                ...report.files,
                missing: report.files.missing ?? [],
                orphaned: report.files.orphaned ?? [],
                present: report.files.present ?? [],
              },
            },
          ]),
        ),
      };

      output.json(analyzeDataObj);
      return;
    }

    for (const [version, report] of analyzeData.versions.entries()) {
      output.log(`Version: ${version}`);
      if (report.isComplete) {
        output.log(`  Status: ${green("complete")}`);
      } else {
        output.warning(`  Status: ${red("incomplete")}`);
      }
      output.log(`  Files: ${report.counts.success}`);
      if (report.files.missing && report.files.missing.length > 0) {
        output.warning(`  Missing files: ${report.files.missing.length}`);
      }
      if (report.files.orphaned && report.files.orphaned.length > 0) {
        output.warning(`  Orphaned files: ${report.files.orphaned.length}`);
      }

      if (report.counts.total) {
        output.log(`  Total files expected: ${report.counts.total}`);
      }
    }
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      output.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    if (err instanceof CLIError) {
      err.toPrettyMessage();
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
