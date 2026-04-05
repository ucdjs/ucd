const PIPELINE_SUFFIXES_RE = /(?:\.ucd-pipeline)?\.ts$/;

export const PIPELINE_FILE_SUFFIXES = [".ucd-pipeline.ts", ".ts"] as const;

export function stripSuffixes(
  fileName: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  if (suffixes === PIPELINE_FILE_SUFFIXES) {
    return fileName.replace(PIPELINE_SUFFIXES_RE, "");
  }
  for (const suffix of suffixes) {
    if (fileName.endsWith(suffix)) {
      return fileName.slice(0, -suffix.length);
    }
  }
  return fileName;
}

export function sanitizeSegment(segment: string): string {
  return segment.trim().replace(/[~\s]+/g, "-");
}

function pathSegments(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string[] {
  // eslint-disable-next-line e18e/prefer-static-regex
  const parts = filePath.replace(/\\/g, "/").replace(/^\.\/+/, "").split("/").filter(Boolean);
  if (parts.length === 0) return [];
  parts[parts.length - 1] = stripSuffixes(parts.at(-1)!, suffixes) || parts.at(-1)!;
  return parts;
}

export function fileIdFromPath(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  return pathSegments(filePath, suffixes).map(sanitizeSegment).join("~");
}

export function fileLabelFromPath(
  filePath: string,
  suffixes: readonly string[] = PIPELINE_FILE_SUFFIXES,
): string {
  return pathSegments(filePath, suffixes).join("/");
}
