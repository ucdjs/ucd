import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { getRawUnicodeAsset } from "#lib/files";
import { highlightUCDFileStream, SHIKI_CACHE_MAX_AGE } from "#lib/shiki";
import { createRoute, z } from "@hono/zod-openapi";
import { dedent } from "@luxass/utils";
import { customError, detectUCDLanguage, isShikiEligible, MAX_SHIKI_SIZE } from "@ucdjs-internal/worker-utils";
import { cache } from "hono/cache";
import { stream } from "hono/streaming";
import { generateReferences, OPENAPI_TAGS } from "../../openapi";
import { WILDCARD_PARAM } from "./openapi-params";

export const SHIKI_ROUTE = createRoute({
  method: "get",
  path: "/__shiki/{wildcard}",
  tags: [OPENAPI_TAGS.FILES],
  parameters: [
    WILDCARD_PARAM,
  ],
  description: dedent`
    Returns syntax-highlighted HTML version of text-based UCD files.

    This endpoint transforms Unicode data files into syntax-highlighted HTML using Shiki.
    It only works with text-based files and has a strict size limit to prevent worker exhaustion.

    ### Requirements

    - File must be text-based (txt, csv, xml, json, etc.)
    - File size must be ≤256KB
    - File extension must be supported

    ### Caching

    Responses are cached aggressively (30 days with immutable flag) since UCD files
    are immutable once released.

    ### Error Responses

    - **413 Payload Too Large**: File exceeds 256KB limit
    - **415 Unsupported Media Type**: File is not text-based or has unsupported extension
    - **404 Not Found**: File does not exist on unicode.org
  `,
  responses: {
    200: {
      description: "Syntax-highlighted HTML",
      headers: {
        "Content-Type": {
          description: "Always text/html; charset=utf-8",
          schema: { type: "string" },
        },
        "Cache-Control": {
          description: "Caching directives (30 days, immutable)",
          schema: { type: "string" },
        },
        "X-Shiki-Language": {
          description: "Detected UCD language",
          schema: { type: "string" },
        },
        "X-Shiki-Base-Language": {
          description: "Base language used for highlighting",
          schema: { type: "string" },
        },
      },
      content: {
        "text/html": {
          schema: z.string(),
        },
      },
    },
    ...(generateReferences([
      400,
      404,
      413,
      415,
      500,
      502,
    ])),
  },
});

export function registerShikiRoute(router: OpenAPIHono<HonoEnv>) {
  router.openAPIRegistry.registerPath(SHIKI_ROUTE);

  router.get(
    "/__shiki/:wildcard{.*}",
    cache({
      cacheName: "ucdjs:v1_files:shiki",
      cacheControl: `max-age=${SHIKI_CACHE_MAX_AGE}`,
    }),
    async (c) => {
      const path = c.req.param("wildcard")?.trim() || "";

      if (!path) {
        return customError(c, {
          status: 400,
          message: "Path is required",
        });
      }

      // Fetch the file
      const asset = await getRawUnicodeAsset(path);

      if (!asset.ok) {
        const status = asset.status === 404 ? 404 : 502;
        const message = asset.status === 404 ? "Resource not found" : "Bad Gateway";
        return customError(c, { status, message });
      }

      // Get content info
      const contentType = asset.response.headers.get("content-type") || "";
      const sizeHeader = asset.response.headers.get("content-length");
      const size = sizeHeader ? Number.parseInt(sizeHeader, 10) : 0;

      // Validate eligibility
      const eligibility = isShikiEligible(contentType, asset.extension, size);

      if (!eligibility.eligible) {
        const status = size > MAX_SHIKI_SIZE ? 413 : 415;
        return customError(c, {
          status,
          message: eligibility.reason || "File not eligible for syntax highlighting",
        });
      }

      try {
        // Detect language and highlight
        const language = detectUCDLanguage(path);
        const abortController = new AbortController();

        const highlightedStream = await highlightUCDFileStream(
          asset.response.body!,
          language,
          path,
          { signal: abortController.signal },
        );

        c.header("Content-Type", "text/html; charset=utf-8");
        c.header("Cache-Control", `public, max-age=${SHIKI_CACHE_MAX_AGE}, immutable`);
        c.header("Vary", "Accept-Encoding");
        c.header("X-Shiki-Language", language);

        console.warn(`Serving highlighted content for ${path} (language: ${language})`);

        return stream(c, async (stream) => {
          // Write a process to be executed when aborted.
          stream.onAbort(() => {
            console.warn("Aborted!");
            abortController.abort();
          });

          await stream.pipe(highlightedStream);
        });
      } catch (err) {
        return customError(c, {
          status: 500,
          message: err instanceof Error ? err.message : "Failed to highlight file",
        });
      }
    },
  );
}
