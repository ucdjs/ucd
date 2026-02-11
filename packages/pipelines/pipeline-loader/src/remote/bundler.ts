import type { RolldownPlugin } from "rolldown";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSync } from "oxc-parser";
import { transform } from "oxc-transform";
import { build } from "rolldown";
import * as github from "./github";
import * as gitlab from "./gitlab";
import {
  formatRemoteIdentifier,
  isUrlLike,
  parseRemoteIdentifier,
  RemoteNotFoundError,
} from "./utils";

export interface BundleInput {
  content: string;
  identifier: string;
  customFetch?: typeof fetch;
}

const EXTENSIONS = [".ts", ".mts", ".js", ".mjs"];

function assertRelativeSpecifier(specifier: string): void {
  if (isUrlLike(specifier)) {
    throw new Error(`Unsupported import specifier: ${specifier}`);
  }

  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    throw new Error(`Unsupported import specifier: ${specifier}`);
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function appendSuffix(identifier: string, suffix: string): string {
  const remote = parseRemoteIdentifier(identifier);
  if (remote) {
    return formatRemoteIdentifier({
      ...remote,
      path: `${remote.path}${suffix}`,
    });
  }

  if (isUrlLike(identifier)) {
    const url = new URL(identifier);
    url.pathname = `${url.pathname}${suffix}`;
    return url.toString();
  }

  return `${identifier}${suffix}`;
}

function resolveRelativeSpecifier(specifier: string, parentIdentifier: string): string {
  const remote = parseRemoteIdentifier(parentIdentifier);
  if (remote) {
    const parentDir = remote.path ? path.posix.dirname(remote.path) : "";
    const resolvedPath = path.posix.normalize(path.posix.join(parentDir, specifier));
    const cleanPath = resolvedPath.replace(/^\/+/, "");
    return formatRemoteIdentifier({
      ...remote,
      path: cleanPath,
    });
  }

  if (isUrlLike(parentIdentifier)) {
    const base = new URL(parentIdentifier);
    return new URL(specifier, base).toString();
  }

  const parentDir = path.dirname(parentIdentifier);
  return path.resolve(parentDir, specifier);
}

function getSpecifierExtension(specifier: string): string {
  return path.posix.extname(specifier);
}

function buildCandidateIdentifiers(
  specifier: string,
  parentIdentifier: string,
): string[] {
  const resolvedBase = resolveRelativeSpecifier(specifier, parentIdentifier);
  const hasExtension = getSpecifierExtension(specifier) !== "";

  if (hasExtension) {
    return [resolvedBase];
  }

  const normalizedBase = stripTrailingSlash(resolvedBase);
  const candidates: string[] = [];

  for (const ext of EXTENSIONS) {
    candidates.push(appendSuffix(normalizedBase, ext));
  }

  for (const ext of EXTENSIONS) {
    candidates.push(appendSuffix(`${normalizedBase}/index`, ext));
  }

  return candidates;
}

async function loadRemoteSource(
  identifier: string,
  customFetch: typeof fetch,
): Promise<string> {
  const remote = parseRemoteIdentifier(identifier);
  if (!remote) {
    if (isUrlLike(identifier)) {
      throw new Error(`Unsupported import specifier: ${identifier}`);
    }

    try {
      return await readFile(identifier, "utf-8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new RemoteNotFoundError(`Module not found: ${identifier}`);
      }
      throw error;
    }
  }

  const repoRef = { owner: remote.owner, repo: remote.repo, ref: remote.ref };
  if (remote.provider === "github") {
    return github.fetchFile(repoRef, remote.path, { customFetch });
  }
  return gitlab.fetchFile(repoRef, remote.path, { customFetch });
}

async function compileModuleSource(identifier: string, source: string): Promise<string> {
  let filename = identifier;
  try {
    const url = new URL(identifier);
    filename = url.searchParams.get("path") ?? (url.pathname || identifier);
  } catch {
    filename = identifier;
  }

  const result = await transform(filename, source, { sourceType: "module" });

  if (result.errors && result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join("\n");
    throw new Error(`Failed to parse module ${identifier}: ${message}`);
  }

  return result.code;
}

function getStaticImportSpecifiers(source: string, identifier?: string): string[] {
  let parsed: ReturnType<typeof parseSync>;
  try {
    parsed = parseSync(identifier ?? "<inline>", source, {
      sourceType: "module",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse module ${identifier ?? "<inline>"}: ${message}`);
  }

  const specifiers = new Set<string>();

  const visit = (value: unknown): void => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const node = value as Record<string, unknown> & { type?: string };
    if (node.type === "ImportDeclaration") {
      const sourceNode = node.source as { value?: string } | undefined;
      if (sourceNode?.value) {
        specifiers.add(sourceNode.value);
      }
    } else if (node.type === "ExportAllDeclaration" || node.type === "ExportNamedDeclaration") {
      const sourceNode = node.source as { value?: string } | undefined;
      if (sourceNode?.value) {
        specifiers.add(sourceNode.value);
      }
    } else if (node.type === "ImportExpression") {
      const sourceNode = (node.source ?? node.argument) as { type?: string; value?: string } | undefined;
      if (sourceNode?.type === "StringLiteral" && sourceNode.value) {
        specifiers.add(sourceNode.value);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === "parent") {
        continue;
      }
      visit(child);
    }
  };

  visit(parsed.program);

  return Array.from(specifiers);
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
        const code = await compileModuleSource(id, input.content);
        return code;
      }

      const source = moduleCache.get(id) ?? await loadRemoteSource(id, customFetch);
      const code = await compileModuleSource(id, source);
      moduleCache.set(id, source);
      return code;
    },
  };
}

/**
 * Bundle a module entry with remote-aware resolution.
 */
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

/**
 * Convert bundled JavaScript to a data URL for dynamic import.
 */
export function createDataUrl(code: string): string {
  // eslint-disable-next-line node/prefer-global/buffer
  const encoded = Buffer.from(code, "utf-8").toString("base64");
  return `data:text/javascript;base64,${encoded}`;
}

/**
 * Normalize a local file path into an absolute identifier.
 */
export function identifierForLocalFile(filePath: string): string {
  return path.resolve(filePath);
}
