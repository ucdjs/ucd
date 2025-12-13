import type { HonoEnv } from "../../types";
import { Hono } from "hono";
import { parseTar } from "nanotar";
import { clearCacheEntry } from "../../lib/cache";
import { badGateway, badRequest, unauthorized } from "../../lib/errors";

export const TASKS_ROUTER = new Hono<HonoEnv>().basePath("/_tasks");

TASKS_ROUTER.use("/*", async (c, next) => {
  const apiKey = c.req.header("X-UCDJS-Task-Key");
  const expectedKey = await c.env.UCDJS_TASK_API_KEY.get();

  if (!expectedKey) {
    console.error("[tasks]: UCDJS_TASK_API_KEY not configured");
    return badGateway(c);
  }

  if (!apiKey || apiKey !== expectedKey) {
    return unauthorized(c, { message: "Invalid or missing task key" });
  }

  await next();
});

interface UCDJSMeta {
  version: string;
  generatedAt: string;
  fileCount: number;
}

TASKS_ROUTER.post("/upload-manifest", async (c) => {
  const startTime = Date.now();
  const bucket = c.env.UCD_BUCKET;

  if (!bucket) {
    console.error("[tasks]: UCD_BUCKET binding not configured");
    return badGateway(c);
  }

  const contentType = c.req.header("Content-Type");
  if (contentType !== "application/x-tar" && contentType !== "application/gzip") {
    return badRequest(c, { message: "Content-Type must be application/x-tar or application/gzip" });
  }

  try {
    const tarData = await c.req.arrayBuffer();
    const files = parseTar(tarData);

    // eslint-disable-next-line no-console
    console.log(`[tasks]: received tar with ${files.length} files`);

    // Find and parse the meta file to get the version
    const metaFile = files.find((f) => f.name.replace(/^\.\//, "") === ".ucdjs-meta.json");
    if (!metaFile || !metaFile.data) {
      return badRequest(c, { message: "Missing .ucdjs-meta.json in tar archive" });
    }

    let meta: UCDJSMeta;
    try {
      const metaText = new TextDecoder().decode(metaFile.data);
      meta = JSON.parse(metaText) as UCDJSMeta;
    } catch {
      return badRequest(c, { message: "Invalid .ucdjs-meta.json format" });
    }

    if (!meta.version) {
      return badRequest(c, { message: "Missing version in .ucdjs-meta.json" });
    }

    const version = meta.version;
    // eslint-disable-next-line no-console
    console.log(`[tasks]: processing manifest for version ${version}`);

    let uploadedFiles = 0;
    const uploadedFileNames: string[] = [];

    for (const file of files) {
      if (!file.data) {
        continue;
      }

      const fileName = file.name.replace(/^\.\//, "");
      if (!fileName) {
        continue;
      }

      // Store files under manifest/<version>/ prefix
      // e.g., "manifest.json" -> "manifest/16.0.0/manifest.json"
      const storagePath = `manifest/${version}/${fileName}`;

      await bucket.put(storagePath, file.data, {
        httpMetadata: {
          contentType: "application/json",
        },
      });

      uploadedFiles++;
      uploadedFileNames.push(fileName);
      // eslint-disable-next-line no-console
      console.log(`[tasks]: uploaded ${storagePath}`);
    }

    const duration = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[tasks]: uploaded ${uploadedFiles} files for version ${version} in ${duration}ms`);

    return c.json({
      success: true,
      version,
      filesUploaded: uploadedFiles,
      files: uploadedFileNames,
      duration,
    }, 200);
  } catch (error) {
    console.error("[tasks]: failed to process tar file:", error);
    return badRequest(c, { message: "Failed to process tar file" });
  }
});

TASKS_ROUTER.get("/purge-cache", async (c) => {
  const cacheName = c.req.query("cacheName");
  const path = c.req.query("path");

  if (!cacheName) {
    return badRequest(c, { message: "Missing 'cacheName' query parameter" });
  }

  if (!path) {
    return badRequest(c, { message: "Missing 'path' query parameter" });
  }

  if (!path.startsWith("/")) {
    return badRequest(c, { message: "Path must start with /" });
  }

  try {
    const clearCache = await clearCacheEntry(cacheName);
    const url = new URL(c.req.url);
    const cacheUrl = `${url.origin}${path}`;
    await clearCache(cacheUrl);
    // eslint-disable-next-line no-console
    console.log(`[tasks]: purged cache for ${cacheUrl}`);

    return c.json({
      success: true,
      cacheName,
      purgedUrl: cacheUrl,
    }, 200);
  } catch (error) {
    console.error("[tasks]: failed to purge cache:", error);
    return badGateway(c);
  }
});
