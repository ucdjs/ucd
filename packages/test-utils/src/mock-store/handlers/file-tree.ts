import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const fileTreeRoute = defineMockRouteHandler({
  endpoint: "/api/v1/versions/{version}/file-tree",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
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
          return HttpResponse.json([
            {
              type: "file",
              name: "ArabicShaping.txt",
              path: "ArabicShaping.txt",
              lastModified: 1644920820000,
            },
            {
              type: "file",
              name: "BidiBrackets.txt",
              path: "BidiBrackets.txt",
              lastModified: 1651584360000,
            },
            {
              type: "directory",
              name: "extracted",
              path: "extracted",
              lastModified: 1724676960000,
              children: [
                {
                  type: "file",
                  name: "DerivedBidiClass.txt",
                  path: "DerivedBidiClass.txt",
                  lastModified: 1724609100000,
                },
              ],
            },
          ]);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
