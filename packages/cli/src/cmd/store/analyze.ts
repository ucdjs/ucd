/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import process from "node:process";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";
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
    console.info("No specific versions provided. Analyzing all versions in the store.");
  }

  const {
    storeDir,
    json,
    remote,
    baseUrl,
    include: patterns,
    exclude: excludePatterns,
    lockfileOnly,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      exclude: excludePatterns,
      versions,
      lockfileOnly,
    });

    const [analyzeData, analyzeError] = await store.analyze({
      versions: versions.length > 0 ? versions : undefined,
      filters: {
        include: patterns,
        exclude: excludePatterns,
      },
    });

    if (analyzeError != null) {
      console.error(red(`\n❌ Error analyzing store:`));
      console.error(`  ${analyzeError.message}`);
      return;
    }

    if (!analyzeData) {
      console.error(red(`\n❌ Error: Analyze operation returned no result.`));
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
      process.stdout.write(JSON.stringify(analyzeDataObj, null, 2));
      return;
    }

    for (const [version, report] of analyzeData.entries()) {
      console.info(`Version: ${version}`);
      if (report.isComplete) {
        console.info(`  Status: ${green("complete")}`);
      } else {
        console.warn(`  Status: ${red("incomplete")}`);
      }
      console.info(`  Files: ${report.counts.present}`);
      if (report.files.missing && report.files.missing.length > 0) {
        console.warn(`  Missing files: ${report.files.missing.length}`);
      }
      if (report.files.orphaned && report.files.orphaned.length > 0) {
        console.warn(`  Orphaned files: ${report.files.orphaned.length}`);
      }

      if (report.counts.expected) {
        console.info(`  Total files expected: ${report.counts.expected}`);
      }
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

    console.error(red(`\n❌ Error analyzing store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
