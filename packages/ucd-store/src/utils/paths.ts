import { trimLeadingSlash } from "@luxass/utils";
import { patheJoin } from "@ucdjs/path-utils";
import { hasUCDFolderPath } from "@unicode-utils/core";

export function normalizeStoreRelativePath(path: string, version?: string): string {
  let normalized = path === "/" ? "" : trimLeadingSlash(path);

  if (version && normalized.startsWith(`${version}/`)) {
    normalized = normalized.slice(version.length + 1);
  }

  while (normalized === "ucd" || normalized.startsWith("ucd/")) {
    normalized = normalized === "ucd" ? "" : normalized.slice(4);
  }

  return normalized;
}

export function toStorePath(version: string, path: string): string {
  const relativePath = normalizeStoreRelativePath(path, version);
  return relativePath ? `/${patheJoin(version, relativePath)}` : `/${version}`;
}

export function toLocalStorePath(version: string, path: string): string {
  const relativePath = normalizeStoreRelativePath(path, version);
  return relativePath ? patheJoin(version, relativePath) : version;
}

export function toApiFilePath(version: string, path: string): string {
  const relativePath = normalizeStoreRelativePath(path, version);
  const prefix = hasUCDFolderPath(version) ? "ucd" : "";

  if (!relativePath) {
    return prefix ? patheJoin(version, prefix) : version;
  }

  return patheJoin(version, prefix, relativePath);
}
