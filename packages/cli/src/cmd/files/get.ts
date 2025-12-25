/* eslint-disable no-console */
import type { CLIArguments } from "../../cli-utils";
import type { CLIFilesCmdOptions } from "./root";
import { writeFile } from "node:fs/promises";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";

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
    console.error(red(`\n❌ Error: Path is required.`));
    console.error(`  Usage: ucd files get <path>`);
    console.error(`  Example: ucd files get 16.0.0/ucd/UnicodeData.txt`);
    return;
  }

  const { baseUrl, output } = flags;

  try {
    const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);

    const result = await client.files.get(path);

    if (result.error) {
      console.error(red(`\n❌ Error fetching file:`));
      console.error(`  ${result.error.message}`);
      if (result.error.status === 404) {
        console.error(`  File "${path}" not found.`);
      }
      return;
    }

    if (!result.data) {
      console.error(red(`\n❌ Error: No data returned from API.`));
      return;
    }

    // Check if it's a directory listing (array) or a file (string/binary)
    if (Array.isArray(result.data)) {
      console.error(red(`\n❌ Error: Path "${path}" is a directory, not a file.`));
      console.error(`  Use "ucd files list" to view directory contents.`);
      return;
    }

    const content = result.data as string;

    if (output) {
      await writeFile(output, content, "utf-8");
      console.info(green(`\n✓ File written to: ${output}\n`));
    } else {
      // Write to stdout
      console.info(content);
    }
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error getting file:`));
    console.error(`  ${message}`);
    console.error("Please check the API configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
