import type { UserConfig as TSDownOptions } from "tsdown";
import defu from "defu";
import { defineConfig } from "tsdown";

export const baseConfig = {
  entry: ["./src/index.ts"],
  exports: true,
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  publint: true,
  tsconfig: "./tsconfig.build.json",
  inputOptions: {
    onwarn: (warning, defaultHandler) => {
      if (warning.code === "UNRESOLVED_IMPORT") {
        throw new Error(
          `Unresolved import: ${warning.message}. Please ensure all dependencies are installed and paths are correct.`,
        );
      }

      return defaultHandler(warning);
    },
  },
} satisfies TSDownOptions;

export function createTsdownConfig(overrides: Partial<TSDownOptions> = {}) {
  const merged = defu(baseConfig, overrides) as TSDownOptions;

  // Ensure `entry` arrays are unique to avoid duplicate entries like "./src/index.ts".
  if (Array.isArray(merged.entry)) {
    merged.entry = Array.from(new Set(merged.entry));
  }

  return defineConfig(merged);
}
