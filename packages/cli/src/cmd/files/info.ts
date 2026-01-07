import type { CLIArguments } from "../../cli-utils";
import type { CLIFilesCmdOptions } from "./root";
import { customFetch } from "@ucdjs-internal/shared";
import { UCD_STAT_TYPE_HEADER, UCDJS_API_BASE_URL } from "@ucdjs/env";
import { printHelp } from "../../cli-utils";
import { bold, dim, formatBytes, green, output, red } from "../../output";

export interface CLIFilesInfoCmdOptions {
  path: string;
  flags: CLIArguments<CLIFilesCmdOptions["flags"]>;
}

interface FileMetadata {
  path: string;
  type: "file" | "directory";
  contentType?: string;
  lastModified?: string;
  contentLength?: string;
}

function formatMetadata(metadata: FileMetadata): string {
  const lines: string[] = [];

  lines.push(`  ${bold("Path:")}          ${green(metadata.path || "(root)")}`);
  lines.push(`  ${bold("Type:")}          ${metadata.type === "directory" ? green("directory") : dim("file")}`);

  if (metadata.contentType) {
    lines.push(`  ${bold("Content-Type:")} ${dim(metadata.contentType)}`);
  }

  if (metadata.lastModified) {
    lines.push(`  ${bold("Last Modified:")} ${dim(metadata.lastModified)}`);
  }

  if (metadata.contentLength) {
    const bytes = Number.parseInt(metadata.contentLength, 10);
    const formatted = formatBytes(bytes);
    lines.push(`  ${bold("Size:")}          ${dim(formatted)}`);
  }

  return lines.join("\n");
}

export async function runFilesInfo({ path, flags }: CLIFilesInfoCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Get metadata about a file or directory from the UCD API",
      commandName: "ucd files info",
      usage: "<path> [...flags]",
      description: "Retrieve metadata (type, size, last modified date) about a file or directory without downloading its content.",
      tables: {
        Flags: [
          ["--base-url", "Base URL for the UCD API (defaults to api.ucdjs.dev)."],
          ["--json", "Output metadata as raw JSON."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const { baseUrl, json } = flags;
  const apiBaseUrl = baseUrl || UCDJS_API_BASE_URL;

  try {
    const url = new URL(`/api/v1/files/${path || ""}`, apiBaseUrl);

    const result = await customFetch.safe(url.toString(), {
      method: "HEAD",
    });

    if (result.error) {
      output.error(red(`\n❌ Error fetching file info:`));
      output.error(`  ${result.error.message}`);
      if (result.error.status === 404) {
        output.error(`  Path "${path || "(root)"}" not found.`);
      }
      return;
    }

    if (!result.response) {
      output.error(red(`\n❌ Error: No response from API.`));
      return;
    }

    const headers = result.response.headers;
    const metadata: FileMetadata = {
      path: path || "",
      type: (headers.get(UCD_STAT_TYPE_HEADER) as "file" | "directory") || "file",
      contentType: headers.get("Content-Type") || undefined,
      lastModified: headers.get("Last-Modified") || undefined,
      contentLength: headers.get("Content-Length") || undefined,
    };

    if (json) {
      // Write JSON directly to stdout, bypassing console redirection
      output.json(metadata);
      return;
    }

    // Formatted output
    output.log(`\nFile info: ${green(path || "(root)")}\n`);
    output.log(formatMetadata(metadata));
    output.log("");
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`\n❌ Error getting file info:`));
    output.error(`  ${message}`);
    output.error("Please check the API configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
