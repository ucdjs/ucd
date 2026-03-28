import type { H3, H3Event } from "h3";
import {
  MAX_AGE_ONE_WEEK_SECONDS,
} from "@ucdjs-internal/worker-utils";
import { getCloudflareEnv } from "@ucdjs-internal/worker-utils/h3";
import { transformPathForUnicodeOrg } from "../lib/path-utils";

const CACHE_CONTROL = `max-age=${MAX_AGE_ONE_WEEK_SECONDS}`;

async function handleFilesRequest(event: H3Event): Promise<Response> {
  const env = getCloudflareEnv<Env>(event);
  const version = event.context.params?.version;
  const filepath = event.context.params?._?.replace(/^\/+/, "").trim() || "";

  if (!version) {
    return Response.json({ error: "Version parameter is required" }, { status: 400 });
  }

  if (!("files" in env.UCDJS_API)) {
    return Response.json({ error: "Files API not available" }, { status: 503 });
  }

  const cacheKey = event.req.method === "GET" ? new Request(event.req.url, {
    method: "GET",
    headers: event.req.headers,
  }) : null;

  if (cacheKey) {
    const cachedResponse = await caches.default.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  const { body, status, headers } = await env.UCDJS_API.files(transformPathForUnicodeOrg(version, filepath), {
    query: event.url.searchParams.get("query") || undefined,
    pattern: event.url.searchParams.get("pattern") || undefined,
    type: event.url.searchParams.get("type") || undefined,
    sort: event.url.searchParams.get("sort") || undefined,
    order: event.url.searchParams.get("order") || undefined,
    isHeadRequest: event.req.method === "HEAD",
    stripUCDPrefix: true,
  });

  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has("Cache-Control")) {
    responseHeaders.set("Cache-Control", CACHE_CONTROL);
  }

  const response = new Response(body, {
    status,
    headers: responseHeaders,
  });

  if (cacheKey && response.ok) {
    event.waitUntil(caches.default.put(cacheKey, response.clone()));
  }

  return response;
}

export function registerFilesRoute(app: H3) {
  app.get("/:version/**", handleFilesRequest);
  app.head("/:version/**", handleFilesRequest);
}
