import type { CLIArguments } from "../../cli-utils";
import type { CLILockfileCmdOptions } from "./root";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { safeJsonParse } from "@ucdjs-internal/shared";
import { getLockfilePath, validateLockfile } from "@ucdjs/lockfile";
import { printHelp } from "../../cli-utils";
import { bold, dim, green, output, red, yellow } from "../../output";

export interface CLILockfileValidateCmdOptions {
  flags: CLIArguments<CLILockfileCmdOptions["flags"]>;
}

export async function runLockfileValidate({ flags }: CLILockfileValidateCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Validate lockfile against the expected schema",
      commandName: "ucd lockfile validate",
      usage: "[...flags]",
      description: "Parse and validate the UCD store lockfile, reporting any schema violations or structural issues.",
      tables: {
        Flags: [
          ["--store-dir", "Directory where the UCD store is located (defaults to current directory)."],
          ["--json", "Output validation results as JSON."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const { storeDir, json } = flags;
  const storePath = storeDir ? resolve(storeDir) : process.cwd();
  const lockfilePath = resolve(storePath, getLockfilePath());

  try {
    let rawContent: string;
    try {
      rawContent = await readFile(lockfilePath, "utf-8");
    } catch {
      if (json) {
        output.json({
          valid: false,
          lockfilePath,
          error: "LOCKFILE_NOT_FOUND",
          message: `Lockfile not found at "${lockfilePath}"`,
        });
      } else {
        output.error(red(`\n❌ Error: Lockfile not found at "${lockfilePath}".`));
        output.error(`\n  Run ${green("ucd store init")} to create a new store.`);
      }
      return;
    }

    // If the raw content is not valid JSON, report error
    const jsonData = safeJsonParse(rawContent);
    if (!jsonData) {
      if (json) {
        output.json({
          valid: false,
          lockfilePath,
          error: "INVALID_JSON",
          message: "Lockfile is not valid JSON",
        });
      } else {
        output.error(red(`\n❌ Validation failed: Lockfile is not valid JSON.`));
        output.error(`  ${dim(`Path: ${lockfilePath}`)}`);
      }
      return;
    }

    // Validate the valid json against the lockfile schema.
    const result = validateLockfile(jsonData);

    if (!result.valid) {
      const issues = result.errors ?? [];

      if (json) {
        output.json({
          valid: false,
          lockfilePath,
          error: "SCHEMA_VALIDATION_FAILED",
          issues,
        });
      } else {
        output.error(red(`\n❌ Validation failed: Lockfile does not match expected schema.`));
        output.error(`  ${dim(`Path: ${lockfilePath}`)}\n`);
        output.log(`  ${bold("Issues:")}`);
        for (const issue of issues) {
          output.log(`    ${yellow("•")} ${bold(issue.path || "(root)")}: ${issue.message}`);
        }
      }
      return;
    }

    const warnings: string[] = [];
    const lockfile = result.data!;

    // Check for empty versions
    const versionCount = Object.keys(lockfile.versions).length;
    if (versionCount === 0) {
      warnings.push("Lockfile has no versions tracked.");
    }

    // Check for version entries with inconsistent data
    for (const [version, entry] of Object.entries(lockfile.versions)) {
      if (entry.fileCount === 0) {
        warnings.push(`Version "${version}" has 0 files.`);
      }
      if (entry.totalSize === 0 && entry.fileCount > 0) {
        warnings.push(`Version "${version}" has files but totalSize is 0.`);
      }
    }

    if (json) {
      output.json({
        valid: true,
        lockfilePath,
        lockfileVersion: lockfile.lockfileVersion,
        versionCount,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } else {
      output.log(green(`\n✅ Lockfile is valid.`));
      output.log(`  ${dim(`Path: ${lockfilePath}`)}`);
      output.log(`  ${bold("Lockfile Version:")} ${lockfile.lockfileVersion}`);
      output.log(`  ${bold("Tracked Versions:")} ${versionCount}`);

      if (warnings.length > 0) {
        output.log(`\n  ${yellow(bold("Warnings:"))}`);
        for (const warning of warnings) {
          output.log(`    ${yellow("•")} ${warning}`);
        }
      }
    }
  } catch (err) {
    if (json) {
      output.json({
        valid: false,
        lockfilePath,
        error: "UNKNOWN_ERROR",
        message: err instanceof Error ? err.message : String(err),
      });
    } else {
      output.error(red(`\n❌ Validation error:`));
      if (err instanceof Error) {
        output.error(`  ${err.message}`);
      }
    }
  }
}
