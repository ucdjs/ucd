import { readFile } from "node:fs/promises";
import { transform } from "oxc-transform";
import * as github from "../remote/github";
import * as gitlab from "../remote/gitlab";
import { RemoteNotFoundError } from "./errors";
import { isUrlLike, parseRemoteIdentifier } from "./identifiers";

export async function loadRemoteSource(
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

export async function compileModuleSource(identifier: string, source: string): Promise<string> {
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
