import type { UCDStoreManifest } from "@ucdjs/schemas";
import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const wellKnownConfig = defineMockRouteHandler({
  endpoint: "/.well-known/ucd-config.json",
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
          return HttpResponse.json({
            version: "0.1",
            endpoints: {
              files: "/api/v1/files",
              manifest: "/.well-known/ucd-store.json",
              versions: "/api/v1/versions",
            },
          });
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

        if (shouldUseDefaultValue) {
          // Return default response for the requested version
          // If version is in the versions list, return its manifest, otherwise return empty
          if (versions.includes(version)) {
            return HttpResponse.json({
              expectedFiles: [],
            });
          }

          // Version not found - return 404
          return HttpResponse.json(
            { message: `Manifest not found for version: ${version}` },
            { status: 404 },
          );
        }

        // If providedResponse is an object, it should be the manifest for this version
        // If it's a record keyed by version, extract the specific version
        if (typeof providedResponse === "object" && providedResponse !== null) {
          if (version in providedResponse) {
            return HttpResponse.json((providedResponse as Record<string, any>)[version]);
          }
        }

        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
