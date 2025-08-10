import { HttpResponse } from "../msw";
import { defineMockFetchHandler } from "./__define";

export default defineMockFetchHandler("/api/v1/versions", ({ baseUrl, response }) => {
  if (typeof response === "function") {
    return [
      ["GET", `${baseUrl}/api/v1/versions`, response],
    ];
  }

  return [
    ["GET", `${baseUrl}/api/v1/versions`, () => {
      if (response === true || response == null) {
        return HttpResponse.json([
          {
            version: "17.0.0",
            documentationUrl: "https://www.unicode.org/versions/Unicode17.0.0/",
            date: null,
            url: "https://www.unicode.org/Public/17.0.0",
            mappedUcdVersion: null,
            type: "draft",
          },
          {
            version: "16.0.0",
            documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
            date: "2024",
            url: "https://www.unicode.org/Public/16.0.0",
            mappedUcdVersion: null,
            type: "stable",
          },
        ]);
      }

      return HttpResponse.json(response);
    }],
  ];
});
