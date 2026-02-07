import type { RolldownPlugin } from "rolldown";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "oxc-transform";
import { build } from "rolldown";
import * as github from "./github";
import * as gitlab from "./gitlab";

export interface BundleInput {
  content: string;
  identifier: string;
  fetchFn?: typeof fetch;
}

const EXTENSIONS = [".ts", ".mts", ".js", ".mjs"];

function isUrlLike(value: string): boolean {
  return /^[a-z][a-z+.-]*:/i.test(value);
}

type RemoteProvider = "github" | "gitlab";

interface RemoteIdentifier {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

function parseRemoteIdentifier(identifier: string): RemoteIdentifier | null {
  if (!identifier.startsWith("github://") && !identifier.startsWith("gitlab://")) {
    return null;
  }

  const url = new URL(identifier);
  const provider = url.protocol.replace(":", "") as RemoteProvider;
  const owner = url.hostname;
  const repo = url.pathname.replace(/^\/+/, "");

  if (!owner || !repo) {
    throw new Error(`Invalid remote identifier: ${identifier}`);
  }

  const ref = url.searchParams.get("ref") ?? "HEAD";
  const filePath = url.searchParams.get("path") ?? "";

  return {
    provider,
    owner,
    repo,
    ref,
    path: filePath,
  };
}

function formatRemoteIdentifier(remote: RemoteIdentifier): string {
  const url = new URL(`${remote.provider}://${remote.owner}/${remote.repo}`);
  url.searchParams.set("ref", remote.ref);
  url.searchParams.set("path", remote.path);
  return url.toString();
}

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
  fetchFn: typeof fetch,
): Promise<string> {
  const remote = parseRemoteIdentifier(identifier);
  if (!remote) {
    if (isUrlLike(identifier)) {
      throw new Error(`Unsupported import specifier: ${identifier}`);
    }

    return readFile(identifier, "utf-8");
  }

  const repoRef = { owner: remote.owner, repo: remote.repo, ref: remote.ref };
  if (remote.provider === "github") {
    return github.fetchFile(repoRef, remote.path, { customFetch: fetchFn });
  }
  return gitlab.fetchFile(repoRef, remote.path, { customFetch: fetchFn });
}

async function compileModuleSource(identifier: string, source: string): Promise<string> {
  const result = await transform(identifier, source, { sourceType: "module" });

  if (result.errors && result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join("\n");
    throw new Error(`Failed to parse module ${identifier}: ${message}`);
  }

  return result.code;
}

function createRemotePlugin(input: BundleInput): RolldownPlugin {
  const fetchFn = input.fetchFn ?? fetch;
  const moduleCache = new Map<string, string>();

  return {
    name: "pipeline-remote-loader",
    resolveId: async (specifier, importer) => {
      if (!importer) {
        return input.identifier;
      }

      assertRelativeSpecifier(specifier);

      const candidates = buildCandidateIdentifiers(specifier, importer);
      for (const candidate of candidates) {
        try {
          const source = await loadRemoteSource(candidate, fetchFn);
          moduleCache.set(candidate, source);
          return candidate;
        } catch (err) {
          if (err instanceof Error && err.message.includes("Module not found")) {
            continue;
          }
          if (err instanceof Error && err.message.includes("404")) {
            continue;
          }
          throw err;
        }
      }

      throw new Error(`Module not found: ${specifier}`);
    },
    load: async (id) => {
      if (id === input.identifier) {
        const code = await compileModuleSource(id, input.content);
        return code;
      }

      const source = moduleCache.get(id) ?? await loadRemoteSource(id, fetchFn);
      const code = await compileModuleSource(id, source);
      moduleCache.set(id, source);
      return code;
    },
  };
}

export async function bundleRemoteModule(input: BundleInput): Promise<string> {
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
