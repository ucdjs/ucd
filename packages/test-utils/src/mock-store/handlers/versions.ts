import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const versionsRoute = defineMockRouteHandler({
  endpoint: "/api/v1/versions",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
    versions,
    mockFetch,
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
          const derived = (versions ?? []).map((v, i) => ({
            version: v,
            documentationUrl: `https://www.unicode.org/versions/Unicode${v}/`,
            date: null,
            url: `https://www.unicode.org/Public/${v}`,
            mappedUcdVersion: null,
            // treat the first as "stable" by default
            type: i === 0 ? "stable" : "stable",
          }));

          return HttpResponse.json(derived);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
