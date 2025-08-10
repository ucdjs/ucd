import { HttpResponse } from "../msw";
import { defineMockFetchHandler } from "./__define";

export const versionsMockHandler = defineMockFetchHandler("/api/v1/versions", ({
  versions,
  baseUrl,
  response,
}) => {
  if (typeof response === "function") {
    return [
      ["GET", `${baseUrl}/api/v1/versions`, response],
    ];
  }

  return [
    ["GET", `${baseUrl}/api/v1/versions`, () => {
      if (response === true || response == null) {
        const derived = (versions ?? []).map((v, i) => ({
          version: v,
          documentationUrl: `https://www.unicode.org/versions/Unicode${v}/`,
          date: null,
          url: `https://www.unicode.org/Public/${v}`,
          mappedUcdVersion: null,

          // treat the first as "stable" by default
          type: i === 0 ? "stable" : "stable",
        }));
        return HttpResponse.json(derived);
      }
      return HttpResponse.json(response);
    }],
  ];
});
