import type { StatusCode } from "hono/utils/http-status";
import type { UnicodeAssetResult } from "./files";
import { trimLeadingSlash } from "@luxass/utils";
import { createConcurrencyLimiter } from "@ucdjs-internal/shared";
import {
  DEFAULT_USER_AGENT,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { determineContentTypeFromExtension } from "../routes/v1_files/utils";
import { getFileSizeFromHeaders } from "./files";

const REPORTS_BASE_URL = "https://www.unicode.org/reports";
const REPORT_API_BASE_PATH = "/api/v1/reports";
const REPORT_HOSTS = new Set(["unicode.org", "www.unicode.org"]);
const REPORT_ID_RE = /^tr\d[a-z0-9-]*$/i;
const LINK_HREF_RE = /<a[^>]+\bhref=(["'])(.*?)\1/gi;

type ReportAssetMethod = "GET" | "HEAD";

interface RawReportAssetResult {
  ok: boolean;
  status: StatusCode;
  response: Response;
  extension: string;
}

export interface UnicodeReportRevisionReference {
  revId: string;
  revision: number | null;
  htmlPath: string;
  upstreamUrl: string;
}

export interface UnicodeReportSummary {
  id: string;
  title: string | null;
  latest: UnicodeReportRevisionReference | null;
  previous: UnicodeReportRevisionReference | null;
  next: UnicodeReportRevisionReference | null;
}

export interface UnicodeReportRevisionMetadata {
  reportId: string;
  title: string | null;
  revision: UnicodeReportRevisionReference;
  previous: UnicodeReportRevisionReference | null;
  next: UnicodeReportRevisionReference | null;
}

function createRevisionReference(
  reportId: string,
  revId: string,
  revision: number | null,
  upstreamUrl: string,
): UnicodeReportRevisionReference {
  return {
    revId,
    revision,
    upstreamUrl,
    htmlPath: `${REPORT_API_BASE_PATH}/${reportId}/rev/${revId}/html`,
  };
}

function stripHtml(value: string): string {
  return value
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

async function getRawReportAsset(path: string, method: ReportAssetMethod = "GET"): Promise<RawReportAssetResult> {
  const normalizedPath = trimLeadingSlash(path.trim());
  const url = normalizedPath ? `${REPORTS_BASE_URL}/${normalizedPath}` : `${REPORTS_BASE_URL}/`;
  const response = await fetch(url, {
    method,
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
    },
  });

  const leaf = normalizedPath.split("/").pop() ?? "";
  const extension = leaf.includes(".") ? leaf.split(".").pop()!.toLowerCase() : "";

  return {
    ok: response.ok,
    status: response.status as StatusCode,
    response,
    extension,
  };
}

function getUpstreamRevisionPath(reportId: string, revId: string): string | null {
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

function collectReportInfo(html: string, reportId: string) {
  // eslint-disable-next-line e18e/prefer-static-regex
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    // eslint-disable-next-line e18e/prefer-static-regex
    ?? html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? stripHtml(titleMatch[1]) || null : null;

  const revisions = new Set<number>();
  let hasProposed = false;

  for (const match of html.matchAll(LINK_HREF_RE)) {
    const href = match[2]?.trim();
    if (!href) {
      continue;
    }

    let url: URL;
    try {
      url = new URL(href, `${REPORTS_BASE_URL}/`);
    } catch {
      continue;
    }

    if (!REPORT_HOSTS.has(url.hostname)) {
      continue;
    }

    const pathname = url.pathname.toLowerCase();
    if (pathname === `/reports/${reportId}/proposed.html`) {
      hasProposed = true;
      continue;
    }

    const prefix = `/reports/${reportId}/${reportId}-`;
    if (!pathname.startsWith(prefix) || !pathname.endsWith(".html")) {
      continue;
    }

    const rawRevision = pathname.slice(prefix.length, -".html".length);
    // eslint-disable-next-line e18e/prefer-static-regex
    if (!/^\d+$/.test(rawRevision)) {
      continue;
    }

    const revision = Number.parseInt(rawRevision, 10);
    if (Number.isFinite(revision)) {
      revisions.add(revision);
    }
  }

  const orderedRevisions = [...revisions].toSorted((a, b) => a - b);
  const currentRevision = orderedRevisions.at(-1)
    ?? (() => {
      // eslint-disable-next-line e18e/prefer-static-regex
      const textMatch = html.match(/Revision[\s\S]{0,200}?(\d+)/i);
      if (!textMatch?.[1]) {
        return null;
      }

      const revision = Number.parseInt(textMatch[1], 10);
      return Number.isFinite(revision) ? revision : null;
    })();

  return {
    title,
    revisions: orderedRevisions,
    currentRevision,
    hasProposed,
  };
}

export function isValidReportId(reportId: string): boolean {
  return REPORT_ID_RE.test(reportId);
}

export async function listUnicodeReports(): Promise<UnicodeReportSummary[]> {
  const asset = await getRawReportAsset("", "GET");
  if (!asset.ok) {
    throw new Error("Unable to fetch Unicode reports index");
  }

  const html = await asset.response.text();
  const reportIds = new Set<string>();

  for (const match of html.matchAll(LINK_HREF_RE)) {
    const href = match[2]?.trim();
    if (!href) {
      continue;
    }

    let url: URL;
    try {
      url = new URL(href, `${REPORTS_BASE_URL}/`);
    } catch {
      continue;
    }

    if (!REPORT_HOSTS.has(url.hostname)) {
      continue;
    }

    // eslint-disable-next-line e18e/prefer-static-regex
    const reportMatch = /^\/reports\/(tr\d[a-z0-9-]*)\/$/i.exec(url.pathname);
    if (reportMatch?.[1]) {
      reportIds.add(reportMatch[1].toLowerCase());
    }
  }

  const limit = createConcurrencyLimiter(4);
  const reports = await Promise.all(
    Array.from(reportIds, (reportId) => limit(getUnicodeReportSummary, reportId)),
  );

  return reports.filter((report): report is UnicodeReportSummary => report != null);
}

export async function getUnicodeReportSummary(reportId: string): Promise<UnicodeReportSummary | null> {
  if (!isValidReportId(reportId)) {
    return null;
  }

  const normalizedReportId = reportId.toLowerCase();
  const latestAsset = await getRawReportAsset(`${normalizedReportId}/`, "GET");
  if (!latestAsset.ok) {
    return null;
  }

  const latestHtml = await latestAsset.response.text();
  const latestInfo = collectReportInfo(latestHtml, normalizedReportId);
  const latestRevision = latestInfo.currentRevision;
  const previousRevision = latestRevision == null
    ? null
    : latestInfo.revisions.toReversed().find((revision) => revision < latestRevision) ?? null;

  let nextRevision: number | null = null;
  if (latestInfo.hasProposed) {
    const proposedAsset = await getRawReportAsset(`${normalizedReportId}/proposed.html`, "GET");
    if (proposedAsset.ok) {
      const proposedHtml = await proposedAsset.response.text();
      nextRevision = collectReportInfo(proposedHtml, normalizedReportId).currentRevision;
    }
  }

  return {
    id: normalizedReportId,
    title: latestInfo.title,
    latest: latestRevision == null
      ? null
      : createRevisionReference(
          normalizedReportId,
          `${latestRevision}`,
          latestRevision,
          `${REPORTS_BASE_URL}/${normalizedReportId}/`,
        ),
    previous: previousRevision == null
      ? null
      : createRevisionReference(
          normalizedReportId,
          `${previousRevision}`,
          previousRevision,
          `${REPORTS_BASE_URL}/${normalizedReportId}/${normalizedReportId}-${previousRevision}.html`,
        ),
    next: latestInfo.hasProposed
      ? createRevisionReference(
          normalizedReportId,
          "proposed",
          nextRevision,
          `${REPORTS_BASE_URL}/${normalizedReportId}/proposed.html`,
        )
      : null,
  };
}

export async function getUnicodeReportRevisionMetadata(
  reportId: string,
  revId: string,
): Promise<UnicodeReportRevisionMetadata | null> {
  if (!isValidReportId(reportId)) {
    return null;
  }

  const upstreamPath = getUpstreamRevisionPath(reportId, revId);
  if (!upstreamPath) {
    return null;
  }

  const asset = await getRawReportAsset(upstreamPath, "GET");
  if (!asset.ok) {
    return null;
  }

  const normalizedReportId = reportId.toLowerCase();
  const html = await asset.response.text();
  const info = collectReportInfo(html, normalizedReportId);
  const resolvedRevision = revId === "proposed"
    ? info.currentRevision
    : Number.parseInt(revId, 10);
  const previousRevision = resolvedRevision == null
    ? null
    : info.revisions.toReversed().find((revision) => revision < resolvedRevision) ?? null;
  const nextRevision = resolvedRevision == null
    ? null
    : info.revisions.find((revision) => revision > resolvedRevision) ?? null;

  return {
    reportId: normalizedReportId,
    title: info.title,
    revision: createRevisionReference(
      normalizedReportId,
      revId,
      resolvedRevision ?? null,
      revId === "proposed"
        ? `${REPORTS_BASE_URL}/${normalizedReportId}/proposed.html`
        : `${REPORTS_BASE_URL}/${normalizedReportId}/${normalizedReportId}-${revId}.html`,
    ),
    previous: previousRevision == null
      ? null
      : createRevisionReference(
          normalizedReportId,
          `${previousRevision}`,
          previousRevision,
          `${REPORTS_BASE_URL}/${normalizedReportId}/${normalizedReportId}-${previousRevision}.html`,
        ),
    next: nextRevision != null
      ? createRevisionReference(
          normalizedReportId,
          `${nextRevision}`,
          nextRevision,
          `${REPORTS_BASE_URL}/${normalizedReportId}/${normalizedReportId}-${nextRevision}.html`,
        )
      : info.hasProposed && revId !== "proposed"
        ? createRevisionReference(
            normalizedReportId,
            "proposed",
            null,
            `${REPORTS_BASE_URL}/${normalizedReportId}/proposed.html`,
          )
        : null,
  };
}

export async function getUnicodeReportHtml(
  reportId: string,
  revId: string,
): Promise<UnicodeAssetResult> {
  if (!isValidReportId(reportId)) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 400, message: "Invalid report id" }),
    };
  }

  const upstreamPath = getUpstreamRevisionPath(reportId, revId);
  if (!upstreamPath) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 400, message: "Invalid revision id" }),
    };
  }

  const asset = await getRawReportAsset(upstreamPath, "GET");
  if (!asset.ok) {
    return {
      status: asset.status === 404 ? 404 : 502,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({
        status: asset.status === 404 ? 404 : 502,
        message: asset.status === 404 ? "Resource not found" : "Bad Gateway",
      }),
    };
  }

  const contentType = asset.response.headers.get("content-type") || determineContentTypeFromExtension(asset.extension);
  const lastModified = asset.response.headers.get("last-modified");
  const contentDisposition = asset.response.headers.get("content-disposition");
  const size = getFileSizeFromHeaders(asset.response.headers);
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    [UCD_STAT_TYPE_HEADER]: "file",
  };

  if (lastModified) {
    headers["Last-Modified"] = lastModified;
  }

  if (contentDisposition) {
    headers["Content-Disposition"] = contentDisposition;
  }

  if (size) {
    headers[UCD_STAT_SIZE_HEADER] = size;
  }

  return {
    status: 200,
    kind: "file",
    headers,
    body: asset.response.body,
  };
}
