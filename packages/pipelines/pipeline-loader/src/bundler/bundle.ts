import type { RolldownPlugin } from "rolldown";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build } from "rolldown";
import { compileModuleSource } from "./source";

export interface BundleInput {
  /** Absolute path to the entry file */
  entryPath: string;
}

function createFilesystemPlugin(): RolldownPlugin {
  return {
    name: "pipeline-filesystem-loader",
    resolveId: (specifier: string, importer?: string) => {
      // If no importer, this is the entry point - use the specifier as-is
      if (!importer) {
        return specifier;
      }

      // Resolve relative imports against the importer's directory
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const importerDir = path.dirname(importer);
        return path.resolve(importerDir, specifier);
      }

      // External modules (like @ucdjs/pipelines-core) should be external
      return { id: specifier, external: true };
    },
    load: async (id: string) => {
      // Read the file and compile TypeScript
      const source = await readFile(id, "utf-8");
      return compileModuleSource(id, source);
    },
  };
}

export async function bundleModule(input: BundleInput): Promise<string> {
  const result = await build({
    input: input.entryPath,
    plugins: [createFilesystemPlugin()],
    write: false,
    output: {
      format: "esm",
    },
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []);
  const chunk = chunks.find((item: { type: string }) => item.type === "chunk");

  if (!chunk || chunk.type !== "chunk") {
    throw new Error("Failed to bundle module");
  }

  return chunk.code;
}

export function createDataUrl(code: string): string {
  // eslint-disable-next-line node/prefer-global/buffer
  const encoded = Buffer.from(code, "utf-8").toString("base64");
  return `data:text/javascript;base64,${encoded}`;
}
