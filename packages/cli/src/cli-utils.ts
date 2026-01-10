import type { Prettify, RemoveIndexSignature } from "@luxass/utils";
import type { Arguments } from "yargs-parser";
import type { CLICodegenCmdOptions } from "./cmd/codegen/root";
import type { CLIFilesCmdOptions } from "./cmd/files/root";
import type { CLIStoreCmdOptions } from "./cmd/store/root";
import process from "node:process";
import {
  bgGreen,
  black,
  bold,
  dim,
  green,
} from "farver/fast";
import yargs from "yargs-parser";
import pkg from "../package.json" with { type: "json" };
import { CLIError } from "./errors";
import { setJsonMode } from "./output";

type CLICommand
  = | "help"
    | "version"
    | "codegen"
    | "store"
    | "files";

const SUPPORTED_COMMANDS = new Set<CLICommand>([
  "codegen",
  "store",
  "files",
]);

export interface GlobalCLIFlags {
  force?: boolean;
  help?: boolean;
  // alias for --help
  h?: boolean;
}

export type CLIArguments<T extends Record<string, unknown>> = Prettify<RemoveIndexSignature<
  Arguments & T & GlobalCLIFlags
>>;

/**
 * Resolves the CLI command based on the provided arguments.
 *
 * If the `version` flag is present, it returns the "version" command.
 * Otherwise, it checks if the third argument in the positional arguments (`flags._[2]`)
 * is a supported command. If it is, it returns that command.
 * If no supported command is found, it defaults to the "help" command.
 *
 * @param {Arguments} flags - The parsed arguments from the command line.
 * @returns {CLICommand} The resolved CLI command.
 */
export function resolveCommand(flags: Arguments): CLICommand {
  if (flags.version) return "version";
  const cmd = flags._[0] as string;

  if (SUPPORTED_COMMANDS.has(cmd as CLICommand)) {
    return cmd as CLICommand;
  }

  return "help";
}

export function printHelp({
  commandName,
  headline,
  usage,
  tables,
  description,
}: {
  commandName: string;
  headline?: string;
  usage?: string;
  tables?: Record<string, [command: string, help: string][]>;
  description?: string;
}) {
  const terminalWidth = process.stdout.columns || 80;
  const isTinyTerminal = terminalWidth < 60;

  // add two spaces before all content
  const indent = "  ";

  // helper functions
  const linebreak = () => "";

  // table rendering with improved spacing
  const table = (rows: [string, string][], { padding }: { padding: number }) => {
    let raw = "";

    for (const [command, help] of rows) {
      if (isTinyTerminal) {
        // stack vertically in small terminals
        raw += `${indent}${indent}${bold(command)}\n${indent}${indent}${indent}${dim(help)}\n`;
      } else {
        // keep horizontal in normal terminals with better alignment
        const paddedCommand = command.padEnd(padding);
        raw += `${indent}${indent}${bold(paddedCommand)}  ${dim(help)}\n`;
      }
    }
    return raw.slice(0, -1); // remove latest \n
  };

  const message = [];

  // header section with version
  if (headline) {
    message.push(
      `\n${indent}${bgGreen(black(` ${commandName} `))} ${green(`v${pkg.version ?? "0.0.0"}`)}`,
      `${indent}${dim(headline)}`,
    );
  }

  // usage section
  if (usage) {
    message.push(
      linebreak(),
      `${indent}${bold("USAGE")}`,
      `${indent}${indent}${green(commandName)} ${usage}`,
    );
  }

  // description when provided
  if (description) {
    message.push(
      linebreak(),
      `${indent}${bold("DESCRIPTION")}`,
      `${indent}${indent}${description}`,
    );
  }

  // tables with improved formatting
  if (tables) {
    // calculate optimal padding but cap it to avoid excessive space
    function calculateTablePadding(rows: [string, string][]) {
      const maxLength = rows.reduce((val, [first]) => Math.max(val, first.length), 0);
      return Math.min(maxLength, 30) + 2;
    }

    const tableEntries = Object.entries(tables);
    for (const [tableTitle, tableRows] of tableEntries) {
      const padding = calculateTablePadding(tableRows);
      message.push(
        linebreak(),
        `${indent}${bold(tableTitle.toUpperCase())}`,
        table(tableRows, { padding }),
      );
    }
  }

  // add footer
  message.push(
    linebreak(),
    `${indent}${dim(`Run with --help for more information on specific commands.`)}`,
  );

  // eslint-disable-next-line no-console
  console.log(`${message.join("\n")}\n`);
}

/**
 * Runs a command based on the provided CLI command and flags.
 *
 * @param {CLICommand} cmd - The CLI command to execute.
 * @param {Arguments} flags - The flags passed to the command.
 * @returns {Promise<void>} A promise that resolves when the command has finished executing.
 * @throws An error if the command is not found.
 */
export async function runCommand(cmd: CLICommand, flags: Arguments): Promise<void> {
  switch (cmd) {
    case "help":
      printHelp({
        commandName: "ucd",
        headline: "A CLI for working with the Unicode Character Database (UCD).",
        usage: "[command] [...flags]",
        tables: {
          "Commands": [
            ["download", "Download Unicode data files."],
            ["codegen", "Generate TypeScript code from UCD data."],
            ["files", "List and get files from the UCD API."],
          ],
          "Global Flags": [
            ["--force", "Force the operation to run, even if it's not needed."],
            ["--version", "Show the version number and exit."],
            ["--help", "Show this help message."],
          ],
        },
      });
      break;
    case "version":
      // eslint-disable-next-line no-console
      console.log(`  ${bgGreen(black(` ucd `))} ${green(`v${pkg.version ?? "x.y.z"}`)}`);
      break;
    case "codegen": {
      const { runCodegenRoot } = await import("./cmd/codegen/root");
      const subcommand = flags._[1]?.toString() ?? "";
      await runCodegenRoot(subcommand, {
        flags: flags as CLICodegenCmdOptions["flags"],
      });
      break;
    }
    case "store": {
      const { runStoreRoot } = await import("./cmd/store/root");
      const subcommand = flags._[1]?.toString() ?? "";
      await runStoreRoot(subcommand, {
        flags: flags as CLIStoreCmdOptions["flags"],
      });
      break;
    }
    case "files": {
      const { runFilesRoot } = await import("./cmd/files/root");
      const subcommand = flags._[1]?.toString() ?? "";
      await runFilesRoot(subcommand, {
        flags: flags as CLIFilesCmdOptions["flags"],
      });
      break;
    }
    default:
      throw new Error(`Error running ${cmd} -- no command found.`);
  }
}

export function parseFlags(args: string[]) {
  return yargs(args, {
    configuration: {
      "parse-positional-numbers": false,
    },
    default: {
      force: false,
    },
    boolean: [
      "force",
      "help",
      "h",
      "dry-run",
      "json",
    ],
    string: [
      "output-dir",
      "base-url",
      "output",
      "store-dir",
    ],
    array: [
      "include",
      "exclude",
    ],
  });
}

export async function runCLI(args: string[]): Promise<void> {
  const flags = parseFlags(args);

  // makes it easier to identify the process via activity monitor or other tools
  process.title = "ucd-cli";

  // Enable JSON mode if --json flag is passed
  setJsonMode(!!flags.json);

  try {
    const cmd = resolveCommand(flags);
    await runCommand(cmd, flags);
  } catch (err) {
    // If the error is instanceof CLIError, use its pretty printer.
    if (err instanceof CLIError) {
      err.toPrettyMessage();

      process.exit(1);
    }

    console.error(err);
    process.exit(1);
  } finally {
    // Reset JSON mode after command completes
    setJsonMode(false);
  }
}
