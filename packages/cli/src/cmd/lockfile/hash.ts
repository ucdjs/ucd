import type { CLIArguments } from "../../cli-utils";
import type { CLILockfileCmdOptions } from "./root";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { computeFileHash, computeFileHashWithoutUCDHeader, stripUnicodeHeader } from "@ucdjs/lockfile";
import { printHelp } from "../../cli-utils";
import { bold, dim, formatBytes, green, output, red, yellow } from "../../output";

export interface CLILockfileHashCmdOptions {
  filePath: string;
  flags: CLIArguments<CLILockfileCmdOptions["flags"] & {
    stripHeader?: boolean;
    compare?: string;
  }>;
}

export async function runLockfileHash({ filePath, flags }: CLILockfileHashCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Compute content hash for a file",
      commandName: "ucd lockfile hash",
      usage: "<file-path> [...flags]",
      description: "Compute the SHA-256 hash of a file, optionally stripping the Unicode header first. Useful for debugging and verifying file integrity.",
      tables: {
        Flags: [
          ["--strip-header", "Strip the Unicode header before computing hash (default: false)."],
          ["--compare <hash>", "Compare computed hash with the provided hash."],
          ["--json", "Output hash information as JSON."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!filePath) {
    output.error(red(`\n❌ Error: File path is required.`));
    output.error(`\n  Usage: ${green("ucd lockfile hash <file-path>")}`);
    return;
  }

  const { json, stripHeader, compare } = flags;
  const resolvedPath = resolve(process.cwd(), filePath);

  try {
    let content: string;
    try {
      content = await readFile(resolvedPath, "utf-8");
    } catch {
      if (json) {
        output.json({
          success: false,
          filePath: resolvedPath,
          error: "FILE_NOT_FOUND",
          message: `File not found at "${resolvedPath}"`,
        });
      } else {
        output.error(red(`\n❌ Error: File not found at "${resolvedPath}".`));
      }
      return;
    }

    const fileSize = Buffer.byteLength(content, "utf-8");

    // Compute both hashes for informational purposes
    const fileHash = await computeFileHash(content);
    const contentHash = await computeFileHashWithoutUCDHeader(content);

    // Determine which hash to use based on strip-header flag
    const primaryHash = stripHeader ? contentHash : fileHash;

    // Check if headers would be stripped
    const strippedContent = stripUnicodeHeader(content);
    const hasUnicodeHeader = strippedContent !== content;
    const headerLinesRemoved = hasUnicodeHeader
      ? content.split("\n").length - strippedContent.split("\n").length
      : 0;

    // Compare if requested
    let compareResult: { matches: boolean; providedHash: string } | undefined;
    if (compare) {
      const normalizedCompare = compare.startsWith("sha256:")
        ? compare
        : `sha256:${compare}`;
      compareResult = {
        matches: primaryHash === normalizedCompare,
        providedHash: normalizedCompare,
      };
    }

    if (json) {
      output.json({
        success: true,
        filePath: resolvedPath,
        fileSize,
        formattedSize: formatBytes(fileSize),
        fileHash,
        contentHash,
        hasUnicodeHeader,
        headerLinesRemoved,
        usedHash: stripHeader ? "contentHash" : "fileHash",
        primaryHash,
        comparison: compareResult
          ? {
              providedHash: compareResult.providedHash,
              matches: compareResult.matches,
            }
          : undefined,
      });
      return;
    }

    output.log(`\n  ${bold("File Hash Information")}`);
    output.log(`  ${dim("─".repeat(50))}\n`);

    output.log(`  ${bold("File:")}            ${green(resolvedPath)}`);
    output.log(`  ${bold("Size:")}            ${formatBytes(fileSize)}`);
    output.log(`  ${bold("Unicode Header:")}  ${hasUnicodeHeader ? yellow("Present") : dim("Not detected")}`);
    if (hasUnicodeHeader) {
      output.log(`  ${bold("Header Lines:")}    ${headerLinesRemoved}`);
    }

    output.log(`\n  ${bold("Hashes:")}`);
    output.log(`  ${dim("─".repeat(50))}`);
    output.log(`  ${bold("File Hash:")}       ${dim(fileHash)}`);
    output.log(`                   ${dim("(hash of complete file content)")}`);
    output.log(`  ${bold("Content Hash:")}    ${dim(contentHash)}`);
    output.log(`                   ${dim("(hash with Unicode header stripped)")}`);

    if (compareResult) {
      output.log(`\n  ${bold("Comparison:")}`);
      output.log(`  ${dim("─".repeat(50))}`);
      output.log(`  ${bold("Provided Hash:")}   ${dim(compareResult.providedHash)}`);
      output.log(`  ${bold("Computed Hash:")}   ${dim(primaryHash)}`);
      if (compareResult.matches) {
        output.log(`  ${bold("Result:")}          ${green("✅ Hashes match")}`);
      } else {
        output.log(`  ${bold("Result:")}          ${red("❌ Hashes do not match")}`);
      }
    }

    output.log("");
  } catch (err) {
    if (json) {
      output.json({
        success: false,
        filePath: resolvedPath,
        error: "HASH_COMPUTATION_FAILED",
        message: err instanceof Error ? err.message : String(err),
      });
    } else {
      output.error(red(`\n❌ Error computing hash:`));
      if (err instanceof Error) {
        output.error(`  ${err.message}`);
      }
    }
  }
}
