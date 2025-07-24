import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { GetEntryByPathResult } from "./lib";
import { badRequest, customError } from "@ucdjs/worker-shared";
import { createMiddleware } from "hono/factory";
import { getEntryByPath, ProxyFetchError } from "./lib";

export const entryMiddleware = createMiddleware<{
  Variables: {
    entry?: GetEntryByPathResult;
  };
}>(async (c, next) => {
  const path = c.req.param("path") || "";

  if (path.startsWith("..") || path.includes("//")
    || path.startsWith("%2E%2E") || path.includes("%2F%2F")) {
    return badRequest({
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

    return customError({
      status,
      message,
    });
  }

  await next();
});
