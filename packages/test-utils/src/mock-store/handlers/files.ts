import type { UCDStoreManifest } from "@ucdjs/schemas";
import { HttpResponse } from "../../msw";
import { defineMockRouteHandler } from "../define";

export const filesRoute = defineMockRouteHandler({
  endpoint: "/api/v1/files/{wildcard}",
  setup: ({
    url,
    providedResponse,
    mockFetch,
    shouldUseDefaultValue,
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
          return HttpResponse.text("Default file content");
        }

        if (providedResponse instanceof ArrayBuffer || providedResponse instanceof Uint8Array) {
          return new HttpResponse(providedResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (
          (typeof Blob !== "undefined" && providedResponse instanceof Blob)
          || (typeof File !== "undefined" && providedResponse instanceof File)
        ) {
          return new HttpResponse(providedResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (typeof providedResponse === "string") {
          return HttpResponse.text(providedResponse);
        }

        // For FileEntryList or other objects
        return HttpResponse.json(providedResponse);
      }],
    ]);
  },
});
