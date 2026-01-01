import type { CLIArguments } from "../../cli-utils";
import type { CLIFilesCmdOptions } from "./root";
import { createDebugger } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { printHelp } from "../../cli-utils";
import { dim, green, output, red } from "../../output";

const debug = createDebugger("ucdjs:cli:files:list");

export interface CLIFilesListCmdOptions {
  path: string;
  flags: CLIArguments<CLIFilesCmdOptions["flags"]>;
}

interface FileEntry {
  type: "file" | "directory";
  name: string;
  path: string;
  lastModified: number;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatDirectoryListing(entries: FileEntry[]): string {
  if (entries.length === 0) {
    return "  (empty directory)";
  }

  // Sort: directories first, then files, both alphabetically
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  const maxNameLength = Math.max(...sorted.map((e) => e.name.length), 20);
  const padding = Math.min(maxNameLength + 2, 40);

  for (const entry of sorted) {
    const typeIcon = entry.type === "directory" ? green("📁") : "📄";
    const typeLabel = entry.type === "directory" ? green("dir") : dim("file");
    const name = entry.name.padEnd(padding);
    const date = formatDate(entry.lastModified);

    lines.push(`  ${typeIcon} ${name} ${typeLabel}  ${dim(date)}`);
  }

  return lines.join("\n");
}

export async function runFilesList({ path, flags }: CLIFilesListCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "List files and directories from the UCD API",
      commandName: "ucd files list",
      usage: "[path] [...flags]",
      description: "List files and directories from the Unicode Character Database API. If no path is provided, lists the root directory.",
      tables: {
        Flags: [
          ["--base-url", "Base URL for the UCD API (defaults to api.ucdjs.dev)."],
          ["--json", "Output directory listing as raw JSON."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const { baseUrl, json } = flags;

  try {
    const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);
    debug?.(`Fetching directory listing for path "${path || "(root)"}"`);
    const result = await client.files.get(path || "");

    if (result.error) {
      output.error(red(`\n❌ Error fetching directory listing:`));
      output.error(`  ${result.error.message}`);
      if (result.error.status === 404) {
        output.error(`  Path "${path || "(root)"}" not found.`);
      }
      return;
    }

    if (!result.data) {
      output.error(red(`\n❌ Error: No data returned from API.`));
      return;
    }

    // Check if it's a directory listing (array) or a file (string)
    if (typeof result.data === "string") {
      output.error(red(`\n❌ Error: Path "${path || "(root)"}" is a file, not a directory.`));
      output.error(`  Use "ucd files get" to retrieve file content.`);
      return;
    }

    if (!Array.isArray(result.data)) {
      output.error(red(`\n❌ Error: Unexpected response format from API.`));
      return;
    }

    const entries = result.data as FileEntry[];

    if (json) {
      // Write JSON directly to stdout, bypassing console redirection
      output.json(entries);
      return;
    }

    // Formatted output
    const pathDisplay = path || "(root)";
    output.log(`\nDirectory listing: ${green(pathDisplay)}\n`);
    output.log(formatDirectoryListing(entries));
    output.log("");
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`\n❌ Error listing files:`));
    output.error(`  ${message}`);
    output.error("Please check the API configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
