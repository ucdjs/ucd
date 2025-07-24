import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { GetEntryByPathResult } from "./lib";
import { trimTrailingSlash } from "@luxass/utils";
import {
  customError,
  errorHandler,
  internalServerError,
  notFoundHandler,
  setupCors,
  setupRatelimit,
} from "@ucdjs/worker-shared";
import { WorkerEntrypoint } from "cloudflare:workers";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { entryMiddleware } from "./entry-middleware";
import { getEntryByPath, parseUnicodeDirectory, ProxyFetchError } from "./lib";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    entry?: GetEntryByPathResult;
  };
}>({
  strict: false,
});

setupCors(app);
setupRatelimit(app);

// This route is used by the HTTPFileSystemBridge.
// See https://github.com/ucdjs/ucd/blob/a26f975776218e6db3b64c3e5a3036fd05f75ebd/packages/utils/src/fs-bridge/http.ts
app.get(
  "/.ucd-store.json",
  cache({
    cacheName: "unicode-proxy-store",
    cacheControl: "max-age=3600",
  }),
  async (c) => {
    try {
      const result = await getEntryByPath();

      if (result.type !== "directory") {
        return internalServerError(c, {
          message: "Expected a directory for the root entry",
        });
      }

      const versions = result.files.filter((file) => {
        const match = file.name.match(/^(\d+)\.(\d+)\.(\d+)$/);
        return match && match.length === 4;
      }).map(({ name, path }) => ({
        version: name,
        path: trimTrailingSlash(path),
      }));

      return c.json(versions);
    } catch (err) {
      let status: ContentfulStatusCode = 500;
      let message = "Internal Server Error";
      if (err instanceof ProxyFetchError) {
        status = err.status || 502;

        if (err.status === 404) {
          message = "Not Found";
        } else {
          message = err.message || "Failed to fetch Unicode directory";
        }
      }

      return customError({
        status,
        message,
      });
    }
  },
);

app.get(
  "/__stat/:path{.*}?",
  cache({
    cacheName: "unicode-proxy-stat",
    cacheControl: "max-age=604800, stale-while-revalidate=86400",
  }),
  entryMiddleware,
  async (c) => {
    const result = c.get("entry");

    if (!result) {
      return internalServerError(c, {
        message: "Entry not found in context",
      });
    }

    if (result.type === "directory") {
      return c.json({
        type: "directory",
        mtime: result.headers.get("Last-Modified") || new Date().toISOString(),
      });
    }

    return c.json({
      type: "file",
      mtime: result.headers.get("Last-Modified") || new Date().toISOString(),
      size: Number.parseInt(result.headers.get("Content-Length") || "0", 10),
    });
  },
);

app.get(
  "/:path{.*}?",
  cache({
    cacheName: "unicode-proxy",
    cacheControl: "max-age=604800, stale-while-revalidate=86400",
  }),
  entryMiddleware,
  async (c) => {
    const result = c.get("entry");

    if (!result) {
      return internalServerError(c, {
        message: "Entry not found in context",
      });
    }

    if (result.type === "directory") {
      c.header("Last-Modified", result.headers.get("Last-Modified") ?? "");
      return c.json(result.files);
    }

    return c.newResponse(result.content, 200, {
      "Last-Modified": result.headers.get("Last-Modified") ?? "",
      "Content-Type": result.headers.get("Content-Type") ?? "",
      "Content-Length": result.headers.get("Content-Length") ?? "",
      "Content-Disposition": result.headers.get("Content-Disposition") ?? "",
    });
  },
);

app.onError(errorHandler);
app.notFound(notFoundHandler);

export default class UnicodeProxy extends WorkerEntrypoint<CloudflareBindings> {
  async getUnicodeDirectory(path: string = ""): ReturnType<typeof parseUnicodeDirectory> {
    const url = path ? `https://unicode.org/Public/${path}?F=2` : "https://unicode.org/Public?F=2";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch directory: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    return parseUnicodeDirectory(html);
  }

  async getEntryByPath(path: string = ""): Promise<GetEntryByPathResult> {
    return getEntryByPath(path);
  }

  async fetch(request: Request) {
    return app.fetch(request, this.env, this.ctx);
  }
}
