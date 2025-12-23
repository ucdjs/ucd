import type { UCDStoreManifest } from "@ucdjs/schemas";
import { flattenFilePaths } from "@ucdjs-internal/shared";
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
              manifest: "/.well-known/ucd-store.json",
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

export const wellKnownStoreManifest = defineMockRouteHandler({
  endpoint: "/.well-known/ucd-store.json",
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
          return HttpResponse.json(Object.fromEntries(
            versions.map((version) => [version, {
              expectedFiles: [],
            }]),
          ) satisfies UCDStoreManifest);
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
              expectedFiles: flattenFilePaths(files["*"]!),
            });
          }

          // If there is multiple keys in files we will try and match the version
          const version = params.version as string;
          if (version && files[version]) {
            return HttpResponse.json({
              expectedFiles: flattenFilePaths(files[version]),
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
