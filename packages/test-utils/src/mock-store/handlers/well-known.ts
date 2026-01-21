import type { ExpectedFile } from "@ucdjs/schemas";
import type { MockStoreNode } from "../types";
import { flattenFilePaths } from "@ucdjs-internal/shared";
import { hasUCDFolderPath } from "@unicode-utils/core";
import { HttpResponse } from "../../msw";
import { addPathsToFileNodes } from "../add-paths";
import { defineMockRouteHandler } from "../define";

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
              manifest: "/.well-known/ucd-store/{version}.json",
              versions: "/api/v1/versions",
            },
            versions,
          } satisfies typeof providedResponse);
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});

export const wellKnownStoreVersionManifest = defineMockRouteHandler({
  endpoint: "/.well-known/ucd-store/{version}.json",
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
        // Extract version parameter and strip .json extension if present
        let version = params.version as string;
        if (version?.endsWith(".json")) {
          version = version.slice(0, -5); // Remove ".json"
        }

        // If version is not in the provided versions list, return 404
        if (version && !versions.includes(version)) {
          return HttpResponse.json({
            status: 404,
            message: `Manifest not found for version: ${version}`,
            timestamp: new Date().toISOString(),
          }, { status: 404 });
        }

        if (shouldUseDefaultValue) {
          // If the only key in files is "*", we will
          // just return the files object as is.
          if (Object.keys(files).length === 1 && Object.keys(files)[0] === "*") {
            return HttpResponse.json({
              expectedFiles: buildExpectedFiles(files["*"]!, version),
            });
          }

          // If there is multiple keys in files we will try and match the version
          if (version && files[version]) {
            return HttpResponse.json({
              expectedFiles: buildExpectedFiles(files[version]!, version),
            });
          }

          return HttpResponse.json({
            expectedFiles: [],
          });
        }

        // If providedResponse is an object, use it directly
        if (typeof providedResponse === "object" && providedResponse !== null) {
          return HttpResponse.json(providedResponse);
        }

        // Fallback to default
        return HttpResponse.json({
          expectedFiles: [],
        });
      }],
    ]);
  },
});
