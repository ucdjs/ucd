import path from "node:path";
import { formatRemoteIdentifier, isUrlLike, parseRemoteIdentifier } from "./identifiers";

const EXTENSIONS = [".ts", ".mts", ".js", ".mjs"];

export function assertRelativeSpecifier(specifier: string): void {
  if (isUrlLike(specifier)) {
    throw new Error(`Unsupported import specifier: ${specifier}`);
  }

  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    throw new Error(`Unsupported import specifier: ${specifier}`);
  }
}

export function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function appendSuffix(identifier: string, suffix: string): string {
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

export function resolveRelativeSpecifier(specifier: string, parentIdentifier: string): string {
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

export function getSpecifierExtension(specifier: string): string {
  return path.posix.extname(specifier);
}

export function buildCandidateIdentifiers(
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
