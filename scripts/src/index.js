#!/usr/bin/env node
import process from "node:process";
import { CLI_NAME, CLI_VERSION, printCommandHelp } from "#lib/command";

/** @type {import("./lib/command.js").CommandDefinition} */
const rootCommand = {
  usage: `$ ${CLI_NAME} <command>`,
  description: "Internal development scripts for the UCD.js monorepo.",
  options: {
    version: {
      type: "boolean",
      short: "v",
      description: "Display the CLI version",
    },
  },
  commands: [
    {
      name: "setup-dev",
      description: "Seed local API environment with manifests",
    },
    {
      name: "refresh-manifests",
      description: "Generate and upload manifests to remote",
    },
    {
      name: "release",
      description: "Run release prepare, verify, or publish",
    },
  ],
};

/**
 * @param {string[]=} args
 * @returns {Promise<void>}
 */
export async function run(args = process.argv.slice(2)) {
  if (args.length === 0) {
    printCommandHelp(rootCommand);
    return;
  }

  const [commandName, ...commandArgs] = args;
  if (!commandName) {
    printCommandHelp(rootCommand);
    return;
  }

  if (commandName === "--help" || commandName === "-h") {
    printCommandHelp(rootCommand);
    return;
  }

  if (commandName === "--version" || commandName === "-v") {
    console.log(CLI_VERSION);
    return;
  }

  switch (commandName) {
    case "setup-dev": {
      const { runSetupDevCommand } = await import("./commands/setup-dev.js");
      await runSetupDevCommand(commandArgs);
      return;
    }
    case "refresh-manifests": {
      const { runRefreshManifestsCommand } = await import("./commands/refresh-manifests.js");
      await runRefreshManifestsCommand(commandArgs);
      return;
    }
    case "release": {
      const { runReleaseCommand } = await import("./commands/release.js");
      await runReleaseCommand(commandArgs);
      return;
    }
    default:
      console.error(`Unknown command "${commandName}".`);
      printCommandHelp(rootCommand);
      process.exit(1);
  }
}
