import type { ExpectedFile } from "@ucdjs/schemas";
import type { MockStoreNode } from "../types";
import { flattenFilePaths } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { HttpResponse } from "../../msw";
import { addPathsToFileNodes } from "../add-paths";
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

/**
 * Builds an array of ExpectedFile objects from mock store nodes.
 * Each file includes name, path (for API), and storePath (for store subdomain).
 *
 * @param nodes - The mock store nodes representing files
 * @param version - The Unicode version
 * @returns Array of ExpectedFile objects
 */
function buildExpectedFiles(nodes: MockStoreNode[], version: string): ExpectedFile[] {
  // Build paths with /ucd/ for API files endpoint (for versions >= 4.1.0)
  const apiBasePath = hasUCDFolderPath(version) ? "ucd" : "";
  const apiPathNodes = addPathsToFileNodes(nodes, version, apiBasePath);
  const apiPaths = flattenFilePaths(apiPathNodes);

  // Build paths without /ucd/ for store subdomain
  const storePathNodes = addPathsToFileNodes(nodes, version, "");
  const storePaths = flattenFilePaths(storePathNodes);

  // Combine into structured objects
  return apiPaths.map((apiPath, index) => {
    const name = apiPath.split("/").pop() || "";
    return {
      name,
      path: apiPath,
      storePath: storePaths[index]!,
    };
  });
}

export const versionManifest = defineMockRouteHandler({
  endpoint: "/api/v1/versions/{version}/manifest",
  setup: ({
    url,
    providedResponse,
    shouldUseDefaultValue,
    versions,
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
        const version = params.version as string;
        if (version && !versions.includes(version)) {
          return HttpResponse.json({
            status: 404,
            message: `Manifest not found for version: ${version}`,
            timestamp: new Date().toISOString(),
          }, { status: 404 });
        }

        if (shouldUseDefaultValue) {
          if (Object.keys(files).length === 1 && Object.keys(files)[0] === "*") {
            return HttpResponse.json({
              expectedFiles: buildExpectedFiles(files["*"]!, version),
            });
          }

          if (version && files[version]) {
            return HttpResponse.json({
              expectedFiles: buildExpectedFiles(files[version]!, version),
            });
          }

          return HttpResponse.json({
            expectedFiles: [],
          });
        }

        if (typeof providedResponse === "object" && providedResponse !== null) {
          return HttpResponse.json(providedResponse);
        }

        return HttpResponse.json({
          expectedFiles: [],
        });
      }],
    ]);
  },
});
