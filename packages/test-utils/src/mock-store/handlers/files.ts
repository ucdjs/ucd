import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { HandlerContext } from "../types";
import { HttpResponse } from "../../msw";

export function setupFilesHandler({
  baseUrl,
  response,
  mockFetch,
}: HandlerContext<"/api/v1/files/:wildcard">): void {
  if (typeof response === "function") {
    mockFetch([
      ["GET", `${baseUrl}/api/v1/files/*`, response],
    ]);
    return;
  }

  mockFetch([
    ["GET", `${baseUrl}/api/v1/files/*`, () => {
      if (response === true || response == null) {
        return HttpResponse.text("Default file content");
      }

      if (response instanceof ArrayBuffer || response instanceof Uint8Array) {
        return new HttpResponse(response, { headers: { "Content-Type": "application/octet-stream" } });
      }

      if (
        (typeof Blob !== "undefined" && response instanceof Blob)
        || (typeof File !== "undefined" && response instanceof File)
      ) {
        return new HttpResponse(response, { headers: { "Content-Type": "application/octet-stream" } });
      }

      if (typeof response === "string") {
        return HttpResponse.text(response);
      }

      // For FileEntryList or other objects
      return HttpResponse.json(response);
    }],
  ]);
}

export function setupStoreManifestHandler({
  baseUrl,
  response,
  versions,
  mockFetch,
}: HandlerContext<"/api/v1/files/.ucd-store.json">): void {
  if (typeof response === "function") {
    mockFetch([
      ["GET", `${baseUrl}/api/v1/files/.ucd-store.json`, response],
    ]);
    return;
  }

  mockFetch([
    ["GET", `${baseUrl}/api/v1/files/.ucd-store.json`, () => {
      if (response === true || response == null) {
        return HttpResponse.json(Object.fromEntries(
          versions.map((version) => [version, version]),
        ) satisfies UCDStoreManifest);
      }

      return HttpResponse.json(response);
    }],
  ]);
}
