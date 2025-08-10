import { HttpResponse } from "../msw";
import { defineMockFetchHandler } from "./__define";

export default defineMockFetchHandler(({ baseUrl, response }) => {
  const fileResponse = response === true || response == null
    ? "Default file content"
    : response;

  return [
    [
      "GET",
      `${baseUrl}/api/v1/files/*`,
      () => {
        if (fileResponse instanceof ArrayBuffer || fileResponse instanceof Uint8Array) {
          return new HttpResponse(fileResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (
          (typeof Blob !== "undefined" && fileResponse instanceof Blob)
          || (typeof File !== "undefined" && fileResponse instanceof File)
        ) {
          return new HttpResponse(fileResponse, { headers: { "Content-Type": "application/octet-stream" } });
        }

        if (typeof fileResponse === "string") {
          return HttpResponse.text(fileResponse);
        }

        // For FileEntryList or other objects
        return HttpResponse.json(fileResponse);
      },
    ],
  ];
});
