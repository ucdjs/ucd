import { HttpResponse } from "../../msw";
import { addPathsToFileNodes } from "../add-paths";
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
          const version = params.version as string;

          // If the only key in files is "*", we will use it with the requested version
          if (Object.keys(files).length === 1 && Object.keys(files)[0] === "*") {
            const filesData = files["*"];
            if (filesData) {
              const filesWithPaths = addPathsToFileNodes(filesData, version);
              return HttpResponse.json(filesWithPaths);
            }
            return HttpResponse.json([]);
          }

          // If there are version-specific files, use them
          if (version && files[version]) {
            const filesWithPaths = addPathsToFileNodes(files[version]!, version);
            return HttpResponse.json(filesWithPaths);
          }

          // Otherwise, use wildcard files if available
          if (files["*"]) {
            const filesWithPaths = addPathsToFileNodes(files["*"], version);
            return HttpResponse.json(filesWithPaths);
          }

          return HttpResponse.json([]);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
