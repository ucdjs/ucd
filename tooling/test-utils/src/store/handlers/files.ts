import { HttpResponse } from "../../msw/msw";
import { defineMockFetchHandler } from "./define";

export default defineMockFetchHandler(({ baseUrl, response }) => {
  const fileResponse = response === true
    ? "Default file content"
    : response;

  return [
    [
      "GET",
      `${baseUrl}/api/v1/files/*`,
      () => {
        if (fileResponse instanceof ArrayBuffer || fileResponse instanceof Uint8Array) {
          return new HttpResponse(fileResponse);
        }
        if (fileResponse instanceof Blob || fileResponse instanceof File) {
          return new HttpResponse(fileResponse);
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
