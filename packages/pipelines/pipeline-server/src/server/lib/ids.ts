const PATH_SEPARATOR = "~";
const BACKSLASH_RE = /\\/g;
const LEADING_DOT_SLASH_RE = /^\.\/+/;
const DUPLICATE_SLASH_RE = /\/+/g;
const TILDE_RE = /~/g;
const WHITESPACE_RE = /\s+/g;

export const PIPELINE_FILE_SUFFIXES = [".ucd-pipeline.ts", ".ts"] as const;

function normalizePathSegments(filePath: string): string[] {
  const normalized = filePath
    .replace(BACKSLASH_RE, "/")
    .replace(LEADING_DOT_SLASH_RE, "")
    .replace(DUPLICATE_SLASH_RE, "/");

  return normalized.split("/").filter(Boolean);
}

export function stripSuffixes(
  fileName: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  for (const suffix of suffixes) {
    if (fileName.endsWith(suffix)) {
      return fileName.slice(0, -suffix.length);
    }
  }

  return fileName;
}

export function sanitizeSegment(segment: string): string {
  return segment.trim().replace(TILDE_RE, "-").replace(WHITESPACE_RE, "-");
}

export function fileIdFromPath(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  const segments = normalizePathSegments(filePath);

  if (segments.length === 0) return "";

  const lastSegment = segments.at(-1) ?? "";
  const strippedLast = stripSuffixes(lastSegment, suffixes) || lastSegment;

  const idSegments = [
    ...segments.slice(0, -1).map(sanitizeSegment),
    sanitizeSegment(strippedLast),
  ].filter(Boolean);

  return idSegments.join(PATH_SEPARATOR);
}

export function fileLabelFromPath(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  const segments = normalizePathSegments(filePath);

  if (segments.length === 0) return "";

  const lastSegment = segments.at(-1) ?? "";
  const strippedLast = stripSuffixes(lastSegment, suffixes) || lastSegment;
  const labelSegments = [...segments.slice(0, -1), strippedLast].filter(Boolean);

  return labelSegments.join("/");
}
