import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const wellKnownConfig = defineMockRouteHandler({
  endpoint: "/.well-known/ucd-config.json",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
    mockFetch,
    versions,
  }) => {
    if (typeof providedResponse === "function") {
      mockFetch([
        ["GET", url, providedResponse],
      ]);
      return;
    }

    mockFetch([
      ["GET", url, () => {
        if (shouldUseDefaultValue) {
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/api/v1/versions/{version}/manifest",
              versions: "/api/v1/versions",
              reports: "/api/v1/reports",
            },
            versions,
          } satisfies typeof providedResponse);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
