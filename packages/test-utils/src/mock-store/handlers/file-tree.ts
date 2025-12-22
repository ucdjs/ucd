import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const fileTreeRoute = defineMockRouteHandler({
  endpoint: "/api/v1/versions/{version}/file-tree",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
    mockFetch,
    files,
  }) => {
    if (typeof providedResponse === "function") {
      mockFetch([
        ["GET", url, providedResponse],
      ]);
      return;
    }

    mockFetch([
      ["GET", url, ({ params }) => {
        if (shouldUseDefaultValue) {
          // If the only key in files is "*", we will
          // just return the files object as is.
          if (Object.keys(files).length === 1 && Object.keys(files)[0] === "*") {
            return HttpResponse.json(files["*"]);
          }

          // If there is multiple keys in files we will try and match the version
          const version = params.version as string;
          if (version && files[version]) {
            return HttpResponse.json(files[version]);
          }

          return HttpResponse.json([]);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
