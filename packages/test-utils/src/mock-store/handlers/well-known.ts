import type { HandlerContext } from "../types";
import { HttpResponse } from "../../msw";

export function setupWellKnownHandler({
  baseUrl,
  response,
  mockFetch,
}: HandlerContext<"/.well-known/ucd-config.json">): void {
  if (typeof response === "function") {
    mockFetch([
      ["GET", `${baseUrl}/.well-known/ucd-config.json`, response],
    ]);
    return;
  }

  mockFetch([
    ["GET", `${baseUrl}/.well-known/ucd-config.json`, () => {
      if (response === true || response == null) {
        // Return default well-known config
        const defaultConfig = {
          version: "1.0",
          endpoints: {
            files: "/api/v1/files",
            manifest: "/api/v1/files/.ucd-store.json",
            versions: "/api/v1/versions",
          },
        };
        return HttpResponse.json(defaultConfig);
      }
      return HttpResponse.json(response);
    }],
  ]);
}
