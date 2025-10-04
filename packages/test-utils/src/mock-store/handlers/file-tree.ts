import type { HandlerContext } from "../types";
import { HttpResponse, mockFetch } from "../../msw";

export function setupFileTreeHandler({
  baseUrl,
  response
}: HandlerContext<"/api/v1/versions/:version/file-tree">): void {
  const url = `${baseUrl}/api/v1/versions/:version/file-tree`;

  if (typeof response === "function") {
    mockFetch([
      ["GET", url, response],
    ]);
    return;
  }

  mockFetch([
    ["GET", url, () => {
      if (response === true || response == null) {
        return HttpResponse.json([
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1651584360000,
          },
          {
            type: "directory",
            name: "extracted",
            path: "extracted",
            lastModified: 1724676960000,
            children: [
              {
                type: "file",
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                lastModified: 1724609100000,
              },
            ],
          },
        ]);
      }

      return HttpResponse.json(response);
    }],
  ]);
}
