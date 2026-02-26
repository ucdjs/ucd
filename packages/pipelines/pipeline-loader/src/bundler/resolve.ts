import path from "node:path";

const EXTENSIONS = [".ts", ".mts", ".js", ".mjs"];

export function assertRelativeSpecifier(specifier: string): void {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
    throw new Error(`Unsupported import specifier: ${specifier}. Only relative imports are allowed.`);
  }
}

export function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function appendSuffix(identifier: string, suffix: string): string {
  return `${identifier}${suffix}`;
}

export function resolveRelativeSpecifier(specifier: string, parentIdentifier: string): string {
  const parentDir = path.dirname(parentIdentifier);
  return path.resolve(parentDir, specifier);
}

export function getSpecifierExtension(specifier: string): string {
  return path.extname(specifier);
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
