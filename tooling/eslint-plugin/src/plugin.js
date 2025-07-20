// @ts-check
import noHardcodedOpenApiTags from "./rules/no-hardcoded-openapi-tags.js";

/**
 * @type {import("eslint").ESLint.Plugin}
 */
const plugin = {
  meta: {
    name: "ucdjs",
    version: "x.y.z",
  },
  rules: {
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
