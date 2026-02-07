const PATH_SEPARATOR = "~";

export const PIPELINE_FILE_SUFFIXES = [".ucd-pipeline.ts", ".ts"] as const;

function normalizePathSegments(filePath: string): string[] {
  const normalized = filePath
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/");

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
  return segment.trim().replace(/~/g, "-").replace(/\s+/g, "-");
}

export function fileIdFromPath(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  const segments = normalizePathSegments(filePath);

  if (segments.length === 0) return "";

  const lastSegment = segments[segments.length - 1] ?? "";
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

  const lastSegment = segments[segments.length - 1] ?? "";
  const strippedLast = stripSuffixes(lastSegment, suffixes) || lastSegment;
  const labelSegments = [...segments.slice(0, -1), strippedLast].filter(Boolean);

  return labelSegments.join("/");
}
