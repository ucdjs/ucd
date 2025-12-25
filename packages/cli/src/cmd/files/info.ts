/* eslint-disable no-console */
import type { CLIArguments } from "../../cli-utils";
import type { CLIFilesCmdOptions } from "./root";
import process from "node:process";
import { customFetch } from "@ucdjs-internal/shared";
import { UCD_FILE_STAT_TYPE_HEADER, UCDJS_API_BASE_URL } from "@ucdjs/env";
import { bold, dim, green, red } from "farver/fast";
import { printHelp } from "../../cli-utils";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
      console.error(red(`\n❌ Error fetching file info:`));
      console.error(`  ${result.error.message}`);
      if (result.error.status === 404) {
        console.error(`  Path "${path || "(root)"}" not found.`);
      }
      return;
    }

    if (!result.response) {
      console.error(red(`\n❌ Error: No response from API.`));
      return;
    }

    const headers = result.response.headers;
    const metadata: FileMetadata = {
      path: path || "",
      type: (headers.get(UCD_FILE_STAT_TYPE_HEADER) as "file" | "directory") || "file",
      contentType: headers.get("Content-Type") || undefined,
      lastModified: headers.get("Last-Modified") || undefined,
      contentLength: headers.get("Content-Length") || undefined,
    };

    if (json) {
      // Write JSON directly to stdout, bypassing console redirection
      process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
      return;
    }

    // Formatted output
    console.info(`\nFile info: ${green(path || "(root)")}\n`);
    console.info(formatMetadata(metadata));
    console.info("");
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error getting file info:`));
    console.error(`  ${message}`);
    console.error("Please check the API configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
