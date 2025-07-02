import { defineConfig } from "tsdown";
import { baseConfig } from "./base.js";

/**
 * @typedef {import("tsdown").Options} TsdownOptions
 */

/**
 * Creates a tsdown configuration with the base shared settings
 * and allows for package-specific overrides.
 * @param {TsdownOptions} [overrides={}] - Package-specific configuration overrides
 * @returns {ReturnType<import("tsdown").defineConfig>} - The configured tsdown configuration
 */
export function createTsdownConfig(overrides = {}) {
  return defineConfig({
    ...baseConfig,
    ...overrides,
    entry: overrides.entry || ["./src/index.ts"],
  });
}

export { baseConfig } from "./base.js";
