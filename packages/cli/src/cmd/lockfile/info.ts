import type { CLIArguments } from "../../cli-utils";
import type { CLILockfileCmdOptions } from "./root";
import { resolve } from "node:path";
import process from "node:process";
import NodeFileSystemBridge from "@ucdjs/fs-bridge/bridges/node";
import { getLockfilePath, readLockfile } from "@ucdjs/lockfile";
import { printHelp } from "../../cli-utils";
import {
  bold,
  dim,
  formatBytes,
  green,
  output,
  red,
  yellow,
} from "../../output";

export interface CLILockfileInfoCmdOptions {
  flags: CLIArguments<CLILockfileCmdOptions["flags"]>;
}

export async function runLockfileInfo({ flags }: CLILockfileInfoCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Display lockfile information and summary",
      commandName: "ucd lockfile info",
      usage: "[...flags]",
      description: "Read and display information from the UCD store lockfile including versions, file counts, and sizes.",
      tables: {
        Flags: [
          ["--store-dir", "Directory where the UCD store is located (defaults to current directory)."],
          ["--json", "Output lockfile information as JSON."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const { storeDir, json } = flags;
  const storePath = storeDir ? resolve(storeDir) : process.cwd();

  try {
    const fs = NodeFileSystemBridge({ basePath: storePath });
    const lockfilePath = getLockfilePath();

    let lockfile;
    try {
      lockfile = await readLockfile(fs, lockfilePath);
    } catch (err) {
      output.error(red(`\n❌ Error: Could not read lockfile at "${lockfilePath}".`));
      if (err instanceof Error) {
        output.error(`  ${err.message}`);
      }
      output.error(`\n  Run ${green("ucd store init")} to create a new store.`);
      return;
    }

    const versions = Object.keys(lockfile.versions);
    const totalFiles = Object.values(lockfile.versions).reduce((sum, v) => sum + v.fileCount, 0);
    const totalSize = Object.values(lockfile.versions).reduce((sum, v) => sum + v.totalSize, 0);

    if (json) {
      output.json({
        storePath,
        lockfilePath,
        lockfileVersion: lockfile.lockfileVersion,
        totalVersions: versions.length,
        totalFiles,
        totalSize,
        formattedTotalSize: formatBytes(totalSize),
        filters: lockfile.filters,
        versions: Object.entries(lockfile.versions).map(([version, entry]) => ({
          version,
          ...entry,
          formattedSize: formatBytes(entry.totalSize),
        })),
      });
      return;
    }

    output.log(`\n  ${bold("UCD Store Lockfile Information")}`);
    output.log(`  ${dim("─".repeat(40))}\n`);

    output.log(`  ${bold("Store Path:")}       ${green(storePath)}`);
    output.log(`  ${bold("Lockfile Path:")}    ${dim(lockfilePath)}`);
    output.log(`  ${bold("Lockfile Version:")} ${lockfile.lockfileVersion}`);
    output.log(`  ${bold("Total Versions:")}   ${versions.length}`);
    output.log(`  ${bold("Total Files:")}      ${totalFiles.toLocaleString()}`);
    output.log(`  ${bold("Total Size:")}       ${formatBytes(totalSize)}`);

    // Display filters if any are set
    const includeFilters = lockfile.filters?.include ?? [];
    const excludeFilters = lockfile.filters?.exclude ?? [];
    const disableDefaultExclusions = lockfile.filters?.disableDefaultExclusions ?? false;

    if (includeFilters.length > 0 || excludeFilters.length > 0 || disableDefaultExclusions) {
      output.log(`\n  ${bold("Filters:")}`);
      if (includeFilters.length > 0) {
        output.log(`    ${bold("Include:")} ${includeFilters.join(", ")}`);
      }
      if (excludeFilters.length > 0) {
        output.log(`    ${bold("Exclude:")} ${excludeFilters.join(", ")}`);
      }
      if (disableDefaultExclusions) {
        output.log(`    ${yellow("Default exclusions disabled")}`);
      }
    }

    output.log(`\n  ${bold("Versions:")}`);
    output.log(`  ${dim("─".repeat(40))}`);

    // Sort versions by semver (descending)
    const sortedVersions = versions.sort((a, b) => {
      const [aMajor = 0, aMinor = 0, aPatch = 0] = a.split(".").map(Number);
      const [bMajor = 0, bMinor = 0, bPatch = 0] = b.split(".").map(Number);
      if (bMajor !== aMajor) return bMajor - aMajor;
      if (bMinor !== aMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });

    for (const version of sortedVersions) {
      const entry = lockfile.versions[version];
      if (!entry) continue;

      output.log(`\n    ${green(version)}`);
      output.log(`      ${bold("Files:")}      ${entry.fileCount.toLocaleString()}`);
      output.log(`      ${bold("Size:")}       ${formatBytes(entry.totalSize)}`);
      output.log(`      ${bold("Snapshot:")}   ${dim(entry.path)}`);
    }

    output.log("");
  } catch (err) {
    output.error(red(`\n❌ Error reading lockfile:`));
    if (err instanceof Error) {
      output.error(`  ${err.message}`);
    }
  }
}
