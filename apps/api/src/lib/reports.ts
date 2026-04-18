import type { UnicodeAssetResult } from "./files";
import { createConcurrencyLimiter } from "@ucdjs-internal/shared";
import {
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { determineContentTypeFromExtension } from "../routes/v1_files/utils";
import { getFileSizeFromHeaders } from "./files";
import {
  getReportUpstreamRevisionPath,
  getUpstreamAsset,
  REPORT_HOSTS,
  REPORTS_BASE_URL,
} from "./upstream";

const REPORT_API_BASE_PATH = "/api/v1/reports";
const REPORT_ID_RE = /^tr\d[a-z0-9-]*$/i;
const LINK_HREF_RE = /<a[^>]+\bhref=(["'])(.*?)\1/gi;
const REPORT_PREVIEW_BUCKET_PREFIX = "reports/preview";
const REPORT_PREVIEW_CONTENT_TYPE = "text/html; charset=utf-8";
const REPORT_PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline' https://www.unicode.org",
  "img-src data: https://www.unicode.org",
  "font-src https://www.unicode.org data:",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "form-action 'none'",
].join("; ");

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

function isUnavailableProposedReportHtml(html: string): boolean {
  const text = stripHtml(html).replaceAll(/\s+/g, " ").trim();
  return text.includes("Proposed Update Not Available")
    && text.includes("There is no proposed update of this technical report available at this time.")
    && text.includes("See the latest version");
}

function getReportPreviewStorageKey(reportId: string, revId: string): string {
  return `${REPORT_PREVIEW_BUCKET_PREFIX}/${reportId.toLowerCase()}/${revId}.html`;
}

function isUnsafeJavaScriptUrl(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  return value.replaceAll(/[\u0000-\u0020]+/g, "").toLowerCase().startsWith("javascript:");
}

function createReportPreviewHeaders(source: {
  etag?: string | null;
  uploaded?: Date | null;
  lastModified?: string | null;
} = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": REPORT_PREVIEW_CONTENT_TYPE,
    "Content-Security-Policy": REPORT_PREVIEW_CSP,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    [UCD_STAT_TYPE_HEADER]: "file",
  };

  if (source.etag) {
    headers.ETag = source.etag;
  }

  if (source.uploaded) {
    headers["Last-Modified"] = source.uploaded.toUTCString();
  } else if (source.lastModified) {
    headers["Last-Modified"] = source.lastModified;
  }

  return headers;
}

async function sanitizeReportPreviewHtml(html: string, upstreamUrl: string): Promise<string> {
  let sawHead = false;

  const rewritten = await new HTMLRewriter()
    .on("head", {
      element(element) {
        sawHead = true;
        element.prepend(`<base href="${upstreamUrl}">`, { html: true });
      },
    })
    .on("base", {
      element(element) {
        element.remove();
      },
    })
    .on("script", {
      element(element) {
        element.remove();
      },
    })
    .on("iframe", {
      element(element) {
        element.remove();
      },
    })
    .on("object", {
      element(element) {
        element.remove();
      },
    })
    .on("embed", {
      element(element) {
        element.remove();
      },
    })
    .on("meta[http-equiv]", {
      element(element) {
        element.remove();
      },
    })
    .on("link[rel='preload'][as='script']", {
      element(element) {
        element.remove();
      },
    })
    .on("*", {
      element(element) {
        for (const attribute of [...element.attributes]) {
          const [name, value] = attribute;
          if (!name || !value) {
            continue;
          }

          const normalizedName = name.toLowerCase();
          if (normalizedName.startsWith("on")) {
            element.removeAttribute(name);
            continue;
          }

          if (
            (normalizedName === "href"
              || normalizedName === "src"
              || normalizedName === "action"
              || normalizedName === "formaction")
            && isUnsafeJavaScriptUrl(value)
          ) {
            element.removeAttribute(name);
          }
        }
      },
    })
    .transform(new Response(html, {
      headers: { "Content-Type": REPORT_PREVIEW_CONTENT_TYPE },
    }))
    .text();

  if (sawHead) {
    return rewritten;
  }

  // Some upstream documents omit a <head>; inject one so relative assets resolve from Unicode.org.
  // eslint-disable-next-line e18e/prefer-static-regex
  if (/<html\b[^>]*>/i.test(rewritten)) {
    // eslint-disable-next-line e18e/prefer-static-regex
    return rewritten.replace(/<html\b([^>]*)>/i, `<html$1><head><base href="${upstreamUrl}"></head>`);
  }

  return `<!doctype html><html><head><base href="${upstreamUrl}"></head><body>${rewritten}</body></html>`;
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

async function getAvailableProposedReportHtml(reportId: string): Promise<string | null> {
  const proposedAsset = await getUpstreamAsset(REPORTS_BASE_URL, `${reportId}/proposed.html`, "GET");
  if (!proposedAsset.ok) {
    return null;
  }

  const proposedHtml = await proposedAsset.response.text();
  if (isUnavailableProposedReportHtml(proposedHtml)) {
    return null;
  }

  return proposedHtml;
}

export function isValidReportId(reportId: string): boolean {
  return REPORT_ID_RE.test(reportId);
}

export async function listUnicodeReports(): Promise<UnicodeReportSummary[]> {
  const asset = await getUpstreamAsset(REPORTS_BASE_URL, "", "GET");
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
  const latestAsset = await getUpstreamAsset(REPORTS_BASE_URL, `${normalizedReportId}/`, "GET");
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
  let hasAvailableProposed = false;
  if (latestInfo.hasProposed) {
    const proposedHtml = await getAvailableProposedReportHtml(normalizedReportId);
    if (proposedHtml) {
      hasAvailableProposed = true;
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
    next: hasAvailableProposed
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

  const upstreamPath = getReportUpstreamRevisionPath(reportId, revId);
  if (!upstreamPath) {
    return null;
  }

  const asset = await getUpstreamAsset(REPORTS_BASE_URL, upstreamPath, "GET");
  if (!asset.ok) {
    return null;
  }

  const normalizedReportId = reportId.toLowerCase();
  const html = await asset.response.text();
  if (revId === "proposed" && isUnavailableProposedReportHtml(html)) {
    return null;
  }
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
  const hasAvailableProposed = revId !== "proposed" && info.hasProposed
    ? await getAvailableProposedReportHtml(normalizedReportId) != null
    : false;

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
      : hasAvailableProposed
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
  bucket: R2Bucket | null | undefined,
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

  const upstreamPath = getReportUpstreamRevisionPath(reportId, revId);
  if (!upstreamPath) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 400, message: "Invalid revision id" }),
    };
  }

  if (bucket && revId !== "proposed") {
    const cachedPreview = await bucket.get(getReportPreviewStorageKey(reportId, revId));
    if (cachedPreview) {
      return {
        status: 200,
        kind: "file",
        headers: createReportPreviewHeaders({
          etag: cachedPreview.httpEtag ?? (cachedPreview.etag ? `"${cachedPreview.etag}"` : null),
          uploaded: cachedPreview.uploaded,
        }),
        body: cachedPreview.body,
      };
    }
  }

  const asset = await getUpstreamAsset(REPORTS_BASE_URL, upstreamPath, "GET");
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

  const html = await asset.response.text();
  if (revId === "proposed" && isUnavailableProposedReportHtml(html)) {
    return {
      status: 404,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({
        status: 404,
        message: "Resource not found",
      }),
    };
  }

  const upstreamUrl = revId === "proposed"
    ? `${REPORTS_BASE_URL}/${reportId.toLowerCase()}/proposed.html`
    : `${REPORTS_BASE_URL}/${reportId.toLowerCase()}/${reportId.toLowerCase()}-${revId}.html`;
  const previewHtml = await sanitizeReportPreviewHtml(html, upstreamUrl);
  const headers = createReportPreviewHeaders({
    lastModified: asset.response.headers.get("last-modified"),
  });

  if (bucket && revId !== "proposed") {
    await bucket.put(getReportPreviewStorageKey(reportId, revId), previewHtml, {
      httpMetadata: { contentType: REPORT_PREVIEW_CONTENT_TYPE },
    });
  }

  return {
    status: 200,
    kind: "file",
    headers,
    body: new Response(previewHtml).body,
  };
}

export async function getUnicodeReportRawHtml(
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

  const upstreamPath = getReportUpstreamRevisionPath(reportId, revId);
  if (!upstreamPath) {
    return {
      status: 400,
      headers: { "Content-Type": "application/json" },
      kind: "error",
      body: JSON.stringify({ status: 400, message: "Invalid revision id" }),
    };
  }

  const asset = await getUpstreamAsset(REPORTS_BASE_URL, upstreamPath, "GET");
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

  if (revId === "proposed") {
    const html = await asset.response.text();
    if (isUnavailableProposedReportHtml(html)) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        kind: "error",
        body: JSON.stringify({
          status: 404,
          message: "Resource not found",
        }),
      };
    }

    return {
      status: 200,
      kind: "file",
      headers,
      body: new Response(html).body,
    };
  }

  return {
    status: 200,
    kind: "file",
    headers,
    body: asset.response.body,
  };
}
