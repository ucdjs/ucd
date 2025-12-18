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
