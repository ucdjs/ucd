import fs from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

export const CLI_NAME = "ucdjs-scripts";
export const CLI_VERSION = packageJson.version;

/**
 * @typedef {{
 *   type: "boolean" | "string",
 *   short?: string,
 *   description: string,
 *   valueName?: string,
 *   transform?: (value: boolean | string | undefined) => unknown,
 * }} CommandOptionDefinition
 */

/**
 * @typedef {{
 *   name: string,
 *   description: string,
 * }} CommandEntry
 */

/**
 * @typedef {{
 *   description?: string,
 *   usage: string,
 *   options?: Record<string, CommandOptionDefinition>,
 *   commands?: CommandEntry[],
 * }} CommandDefinition
 */

/**
 * @param {CommandDefinition} definition
 * @returns {void}
 */
export function printCommandHelp(definition) {
  /** @type {string[]} */
  const lines = [
    `${CLI_NAME}/${CLI_VERSION}`,
    "",
    "Usage:",
    `  ${definition.usage}`,
  ];

  if (definition.description) {
    lines.push("", definition.description);
  }

  if (definition.commands && definition.commands.length > 0) {
    lines.push("", "Commands:");
    for (const command of definition.commands) {
      lines.push(`  ${command.name.padEnd(18)} ${command.description}`);
    }
  }

  lines.push("", "Options:");

  const optionEntries = Object.entries(definition.options ?? {});
  for (const [name, option] of optionEntries) {
    const flag = option.type === "string"
      ? `--${name} <${option.valueName ?? "value"}>`
      : `--${name}`;
    const short = option.short ? `-${option.short}, ` : "";
    lines.push(`  ${(short + flag).padEnd(22)} ${option.description}`);
  }

  lines.push("  -h, --help".padEnd(24) + "Display this message");

  console.log(lines.join("\n"));
}

/**
 * @param {boolean | string | undefined} value
 * @param {string} flagName
 * @returns {number | undefined}
 */
export function parsePositiveInteger(value, flagName) {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsed;
}

/**
 * @param {string[]} args
 * @param {CommandDefinition} definition
 * @param {{ allowPositionals?: boolean }=} options
 * @returns {{ values: Record<string, unknown>, positionals: string[] } | null}
 */
export function parseCommand(args, definition, options = {}) {
  /** @type {Record<string, { type: "boolean" | "string", short?: string }>} */
  const parseOptions = {
    help: { type: "boolean", short: "h" },
  };

  for (const [name, option] of Object.entries(definition.options ?? {})) {
    parseOptions[name] = {
      type: option.type,
      short: option.short,
    };
  }

  let parsed;

  try {
    parsed = parseArgs({
      args,
      strict: true,
      allowPositionals: options.allowPositionals ?? false,
      options: parseOptions,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printCommandHelp(definition);
    process.exit(1);
  }

  if (parsed.values.help) {
    printCommandHelp(definition);
    return null;
  }

  /** @type {Record<string, unknown>} */
  const values = {};

  for (const [name, option] of Object.entries(definition.options ?? {})) {
    try {
      const rawValue = parsed.values[name];
      values[name] = option.transform ? option.transform(rawValue) : rawValue;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      printCommandHelp(definition);
      process.exit(1);
    }
  }

  return {
    values,
    positionals: parsed.positionals,
  };
}
