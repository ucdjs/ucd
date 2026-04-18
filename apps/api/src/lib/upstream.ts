import type { StatusCode } from "hono/utils/http-status";
import { trimLeadingSlash } from "@luxass/utils";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";

export const REPORTS_BASE_URL = "https://www.unicode.org/reports";
export const REPORT_HOSTS = new Set(["unicode.org", "www.unicode.org"]);

export type UpstreamAssetMethod = "GET" | "HEAD";

export interface UpstreamAssetResult {
  ok: boolean;
  status: StatusCode;
  response: Response;
  extension: string;
  normalizedPath: string;
  url: string;
}

function getPathExtension(path: string): string {
  const leaf = path.split("/").pop() ?? "";
  return leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";
}

export async function getUpstreamAsset(
  baseUrl: string,
  path: string,
  method: UpstreamAssetMethod = "GET",
): Promise<UpstreamAssetResult> {
  const normalizedPath = trimLeadingSlash(path.trim());
  const url = normalizedPath ? `${baseUrl}/${normalizedPath}` : `${baseUrl}/`;
  const response = await fetch(url, {
    method,
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  return {
    ok: response.ok,
    status: response.status as StatusCode,
    response,
    extension: getPathExtension(normalizedPath),
    normalizedPath,
    url,
  };
}

export function getReportUpstreamRevisionPath(reportId: string, revId: string): string | null {
  const normalizedReportId = reportId.toLowerCase();

  if (revId === "proposed") {
    return `${normalizedReportId}/proposed.html`;
  }

  // eslint-disable-next-line e18e/prefer-static-regex
  if (/^\d+$/.test(revId)) {
    return `${normalizedReportId}/${normalizedReportId}-${revId}.html`;
  }

  return null;
}
