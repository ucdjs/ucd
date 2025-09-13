import type { UCDStoreManifest } from "@ucdjs/schemas";
import { HttpResponse } from "../msw";
import { defineMockFetchHandler } from "./__define";

export const filesMockHandler = defineMockFetchHandler("/api/v1/files/:wildcard", ({ baseUrl, response }) => {
  if (typeof response === "function") {
    return [
      ["GET", `${baseUrl}/api/v1/files/*`, response],
    ];
  }

  return [
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
  ];
});

export const filesStoreMockHandler = defineMockFetchHandler("/api/v1/files/.ucd-store.json", ({
  baseUrl,
  response,
  versions,
}) => {
  if (typeof response === "function") {
    return [
      ["GET", `${baseUrl}/api/v1/files/.ucd-store.json`, response],
    ];
  }

  return [
    ["GET", `${baseUrl}/api/v1/files/.ucd-store.json`, () => {
      if (response === true || response == null) {
        return HttpResponse.json(Object.fromEntries(
          versions.map((version) => [version, version]),
        ) satisfies UCDStoreManifest);
      }

      return HttpResponse.json(response);
    }],
  ];
});
