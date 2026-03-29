// @ts-check
import pkg from "../package.json" with { type: "json" };
import noHardcodedOpenApiTags from "./rules/no-hardcoded-openapi-tags.js";

/**
 * @type {import("eslint").ESLint.Plugin}
 */
const plugin = {
  meta: {
    name: "@ucdjs-tooling/eslint-plugin",
    version: pkg.version,
  },
  rules: {
    // @ts-ignore
    "no-hardcoded-openapi-tags": noHardcodedOpenApiTags,
  },
};

export default plugin;

/**
 * @typedef {typeof plugin["rules"]} RuleDefinitions
 */

/**
 * @typedef {{
 *  [K in keyof RuleDefinitions]: RuleDefinitions[K]["defaultOptions"]
 * }} RuleOptions
 */

/**
 * @typedef {{
 *  [K in keyof RuleOptions]: import("eslint").Linter.RuleEntry<RuleOptions[K]>
 * }} Rules
 */
