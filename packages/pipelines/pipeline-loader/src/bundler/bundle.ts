import type { RolldownPlugin } from "rolldown";
import path from "node:path";
import { build } from "rolldown";
import { RemoteNotFoundError } from "./errors";
import { getStaticImportSpecifiers } from "./parse";
import { assertRelativeSpecifier, buildCandidateIdentifiers } from "./resolve";
import { compileModuleSource, loadRemoteSource } from "./source";

export interface BundleInput {
  content: string;
  identifier: string;
  customFetch?: typeof fetch;
}

function createRemotePlugin(input: BundleInput): RolldownPlugin {
  const customFetch = input.customFetch ?? fetch;
  const moduleCache = new Map<string, string>();

  return {
    name: "pipeline-remote-loader",
    resolveId: async (specifier: string, importer?: string) => {
      if (!importer) {
        return input.identifier;
      }

      assertRelativeSpecifier(specifier);

      const candidates = buildCandidateIdentifiers(specifier, importer);
      for (const candidate of candidates) {
        try {
          const source = await loadRemoteSource(candidate, customFetch);
          moduleCache.set(candidate, source);
          return candidate;
        } catch (err) {
          if (err instanceof RemoteNotFoundError) {
            continue;
          }
          throw err;
        }
      }

      throw new Error(`Module not found: ${specifier}`);
    },
    load: async (id: string) => {
      if (id === input.identifier) {
        return compileModuleSource(id, input.content);
      }

      const source = moduleCache.get(id) ?? await loadRemoteSource(id, customFetch);
      const code = await compileModuleSource(id, source);
      moduleCache.set(id, source);
      return code;
    },
  };
}

export async function bundleRemoteModule(input: BundleInput): Promise<string> {
  const specifiers = getStaticImportSpecifiers(input.content, input.identifier);
  for (const specifier of specifiers) {
    assertRelativeSpecifier(specifier);
  }

  const result = await build({
    input: input.identifier,
    plugins: [createRemotePlugin(input)],
    write: false,
    output: {
      format: "esm",
    },
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []);
  const chunk = chunks.find((item: { type: string }) => item.type === "chunk");

  if (!chunk || chunk.type !== "chunk") {
    throw new Error("Failed to bundle remote module");
  }

  return chunk.code;
}

export function createDataUrl(code: string): string {
  // eslint-disable-next-line node/prefer-global/buffer
  const encoded = Buffer.from(code, "utf-8").toString("base64");
  return `data:text/javascript;base64,${encoded}`;
}

export function identifierForLocalFile(filePath: string): string {
  return path.resolve(filePath);
}
