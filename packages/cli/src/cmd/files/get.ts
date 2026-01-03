import type { CLIArguments } from "../../cli-utils";
import type { CLIFilesCmdOptions } from "./root";
import { writeFile } from "node:fs/promises";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { printHelp } from "../../cli-utils";
import { green, output, red } from "../../output";

export interface CLIFilesGetCmdOptions {
  path: string;
  flags: CLIArguments<CLIFilesCmdOptions["flags"]>;
}

export async function runFilesGet({ path, flags }: CLIFilesGetCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Get a specific file from the UCD API",
      commandName: "ucd files get",
      usage: "<path> [...flags]",
      description: "Download a specific file from the Unicode Character Database API. The file content will be written to stdout by default, or to a file if --output is specified.",
      tables: {
        Flags: [
          ["--base-url", "Base URL for the UCD API (defaults to api.ucdjs.dev)."],
          ["--output (-o)", "Write file content to the specified file path instead of stdout."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  if (!path) {
    output.error(red(`\n❌ Error: Path is required.`));
    output.error(`  Usage: ucd files get <path>`);
    output.error(`  Example: ucd files get 16.0.0/ucd/UnicodeData.txt`);
    return;
  }

  const { baseUrl, output: outputFlag } = flags;

  try {
    const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);

    const result = await client.files.get(path);

    if (result.error) {
      output.error(red(`\n❌ Error fetching file:`));
      output.error(`  ${result.error.message}`);
      if (result.error.status === 404) {
        output.error(`  File "${path}" not found.`);
      }
      return;
    }

    if (!result.data) {
      output.error(red(`\n❌ Error: No data returned from API.`));
      return;
    }

    // Check if it's a directory listing (array) or a file (string/binary)
    if (Array.isArray(result.data)) {
      output.error(red(`\n❌ Error: Path "${path}" is a directory, not a file.`));
      output.error(`  Use "ucd files list" to view directory contents.`);
      return;
    }

    const content = result.data as string;

    if (outputFlag) {
      await writeFile(outputFlag, content, "utf-8");
      output.log(green(`\n✓ File written to: ${outputFlag}\n`));
    } else {
      // Write to stdout
      output.log(content);
    }
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`\n❌ Error getting file:`));
    output.error(`  ${message}`);
    output.error("Please check the API configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
