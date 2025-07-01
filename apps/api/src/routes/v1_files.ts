import type { HonoEnv } from "../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { hasUCDFolderPath, resolveUCDVersion, UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { badRequest, internalServerError } from "@ucdjs/worker-shared";
import { traverse } from "apache-autoindex-parse/traverse";
import { cache } from "hono/cache";
import { GET_UNICODE_FILES_BY_VERSION_ROUTE } from "./v1_files.openapi";

export const V1_FILES_ROUTER = new OpenAPIHono<HonoEnv>().basePath("/api/v1/files");

V1_FILES_ROUTER.get("*", cache({
  cacheName: "unicode-api:files",
  cacheControl: "max-age=604800",
}));

V1_FILES_ROUTER.openapi(GET_UNICODE_FILES_BY_VERSION_ROUTE, async (c) => {
  try {
    const version = c.req.param("version");
    const mappedVersion = resolveUCDVersion(version);

    if (!mappedVersion) {
      return badRequest({
        message: "Invalid Unicode version",
      });
    }

    if (!UNICODE_VERSION_METADATA.map((v) => v.version)
      .includes(version as typeof UNICODE_VERSION_METADATA[number]["version"])) {
      return badRequest({
        message: "Invalid Unicode version",
      });
    }

    const extraPath = hasUCDFolderPath(mappedVersion) ? "/ucd" : "";

    const result = await traverse(`https://unicode.org/Public/${mappedVersion}${extraPath}`, {
      format: "F2",
    });

    return c.json(result, 200);
  } catch (error) {
    console.error("Error processing directory:", error);
    return internalServerError({
      message: "Failed to fetch file mappings",
    });
  }
});
