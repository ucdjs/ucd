import type { HonoEnv } from "#types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { UnicodeFileTree } from "@ucdjs/schemas";
import { isValidUnicodeVersion } from "@ucdjs-internal/shared";
import { badRequest, internalServerError } from "@ucdjs-internal/worker-utils";
import {
  hasUCDFolderPath,
  resolveUCDVersion,
  UNICODE_STABLE_VERSION,
} from "@unicode-utils/core";
import { traverse } from "apache-autoindex-parse/traverse";
import { GET_VERSION_FILE_TREE_ROUTE } from "./file-tree.openapi";

export function registerVersionFileTreeRoute(router: OpenAPIHono<HonoEnv>) {
  router.openapi(GET_VERSION_FILE_TREE_ROUTE, async (c) => {
    try {
      let version = c.req.param("version");

      if (version === "latest") {
        version = UNICODE_STABLE_VERSION;
      }

      const mappedVersion = resolveUCDVersion(version);

      if (!isValidUnicodeVersion(version)) {
        return badRequest(c, {
          message: "Invalid Unicode version",
        });
      }

      const result = await traverse(`https://unicode.org/Public/${mappedVersion}${hasUCDFolderPath(mappedVersion) ? "/ucd" : ""}`, {
        format: "F2",
        basePath: `/${mappedVersion}${hasUCDFolderPath(mappedVersion) ? "/ucd/" : "/"}`,
      });

      return c.json(result as UnicodeFileTree, 200);
    } catch (err) {
      console.error("Error processing directory:", err);
      return internalServerError(c, {
        message: "Failed to fetch file mappings",
      });
    }
  });
}
