import { decodePathSafely } from "@ucdjs/path-utils";
import { HTML_EXTENSIONS } from "../../constants";

export function isInvalidPath(raw: string): boolean {
  const lower = raw.toLowerCase();
  // Reject encoded double slashes and dot-dot in any position (encoded or plain)
  if (
    raw.startsWith("..")
    || raw.includes("//")
    || lower.startsWith("%2e%2e")
    || lower.includes("%2f%2f")
  ) {
    return true;
  }

  const decoded = decodePathSafely(raw);
  if (decoded.split("/").includes("..")) {
    return true;
  }

  return false;
}

const mimeTypes: Record<string, string> = {
  csv: "text/csv",
  xml: "application/xml",
  txt: "text/plain",
  pdf: "application/pdf",
  json: "application/json",
};

export function determineContentTypeFromExtension(extName: string) {
  if (HTML_EXTENSIONS.includes(`.${extName}`)) {
    return "text/html";
  }

  return mimeTypes[extName] || "application/octet-stream";
}
