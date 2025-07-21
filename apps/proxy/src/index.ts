import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { GetEntryByPathResult } from "./lib";
import { customError, internalServerError, notFound, setupCors } from "@ucdjs/worker-shared";
import { WorkerEntrypoint } from "cloudflare:workers";
import { Hono } from "hono";
import { cache } from "hono/cache";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getEntryByPath, parseUnicodeDirectory, ProxyFetchError } from "./lib";

export interface ApiError {
  path: string;
  status: number;
  message: string;
  timestamp: string;
}

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    entry?: GetEntryByPathResult;
  };
}>({
  strict: false,
});

setupCors(app);

app.use("*", async (c, next) => {
  const key
    = c.req.header("cf-connecting-ip")
      ?? c.req.raw.headers.get("x-forwarded-for")
      ?? crypto.randomUUID(); // last-resort unique key
  const { success } = await c.env.RATE_LIMITER.limit({ key });

  if (!success) {
    throw new HTTPException(429, {
      message: "Too Many Requests - Please try again later",
    });
  }

  await next();
});

app.get("/favicon.ico", (c) => {
  return c.newResponse(null, 204, {});
});

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
        throw new HTTPException(500, {
          message: "Failed to fetch Unicode directory",
        });
      }

      const versions = result.files.filter((file) => {
        const match = file.name.match(/^(\d+)\.(\d+)\.(\d+)$/);
        return match && match.length === 4;
      }).map(({ name, path }) => ({
        version: name,
        path,
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

      throw new HTTPException(status, {
        message,
      });
    }
  },
);

const entryMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.param("path") || "";

  if (path.startsWith("..") || path.includes("//")) {
    throw new HTTPException(400, {
      message: "Invalid path",
    });
  }

  try {
    const result = await getEntryByPath(path);
    c.set("entry", result);
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

    throw new HTTPException(status, {
      message,
    });
  }

  await next();
});

app.get(
  "/__stat/:path{.*}?",
  cache({
    cacheName: "unicode-proxy-stat",
    cacheControl: "max-age=604800, stale-while-revalidate=86400",
  }),
  entryMiddleware,
  async (c) => {
    const result = c.get("entry") as GetEntryByPathResult;
    if (result.type === "directory") {
      return c.json({
        type: "directory",
        mtime: result.headers.get("Last-Modified") || new Date().toISOString(),
        size: 0,
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
    const result = c.get("entry") as GetEntryByPathResult;

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

app.onError(async (err, c) => {
  console.warn("Error processing request:", c.req.path);
  console.error(err);
  if (err instanceof HTTPException) {
    return customError({
      status: err.status,
      message: err.message,
    });
  }

  return internalServerError();
});

app.notFound(async (c) => {
  console.warn("Not Found:", c.req.path);
  return notFound();
});

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
