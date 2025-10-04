import type { HandlerContext } from "../types";
import { HttpResponse, mockFetch } from "../../msw";

export function setupVersionsHandler({
  versions,
  baseUrl,
  response,
}: HandlerContext<"/api/v1/versions">): void {
  if (typeof response === "function") {
    mockFetch([
      ["GET", `${baseUrl}/api/v1/versions`, response],
    ]);
    return;
  }

  mockFetch([
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
  ]);
}
