import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { getLanguageFromPath, highlightCode } from "./code-highlight";

export const MAX_HIGHLIGHT_SIZE = 500 * 1024;

export interface HighlightedFileResult {
  content: string;
  html: string;
  lines: number;
  language: string;
  contentType: string;
  size: number;
}

export class HighlightFileError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HighlightFileError";
    this.status = status;
  }
}

interface HighlightFileOptions {
  path: string;
  apiBaseUrl: string;
  signal?: AbortSignal;
  statType?: string | null;
  size?: number | null;
  contentType?: string | null;
}

export async function getHighlightedFile({
  path,
  apiBaseUrl,
  signal,
  statType: initialStatType,
  size: initialSize,
  contentType: initialContentType,
}: HighlightFileOptions): Promise<HighlightedFileResult> {
  const url = new URL(path, `${apiBaseUrl}/api/v1/files/`);

  let statType = initialStatType ?? null;
  let size = typeof initialSize === "number" ? initialSize : null;
  let contentType = initialContentType ?? "text/plain";

  if (!statType || size === null) {
    const headResponse = await fetch(url, {
      method: "HEAD",
      signal,
    });

    if (headResponse.status === 404) {
      throw new HighlightFileError("Not found", 404);
    }

    if (!headResponse.ok) {
      throw new HighlightFileError("Failed to fetch file", 502);
    }

    statType = headResponse.headers.get(UCD_STAT_TYPE_HEADER);
    contentType = headResponse.headers.get("Content-Type") || contentType;
    const sizeHeader = headResponse.headers.get(UCD_STAT_SIZE_HEADER) || headResponse.headers.get("Content-Length");
    size = sizeHeader ? Number.parseInt(sizeHeader, 10) : 0;
  }

  if (statType === "directory") {
    throw new HighlightFileError("Directories are not supported", 400);
  }

  if (size > MAX_HIGHLIGHT_SIZE) {
    throw new HighlightFileError("File too large", 413);
  }

  const fileResponse = await fetch(url, {
    method: "GET",
    signal,
  });

  if (fileResponse.status === 404) {
    throw new HighlightFileError("Not found", 404);
  }

  if (!fileResponse.ok) {
    throw new HighlightFileError("Failed to fetch file", 502);
  }

  const responseContentType = fileResponse.headers.get("Content-Type");
  if (responseContentType) {
    contentType = responseContentType;
  }

  const content = await fileResponse.text();
  if (content.length > MAX_HIGHLIGHT_SIZE) {
    throw new HighlightFileError("File too large", 413);
  }

  const language = getLanguageFromPath(path);
  const html = await highlightCode(content, language);

  return {
    content,
    html,
    lines: content.split("\n").length,
    language,
    contentType,
    size: content.length,
  };
}
