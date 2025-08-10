import { HttpResponse } from "../msw";
import { defineMockFetchHandler } from "./__define";

export const fileTreeMockHandler = defineMockFetchHandler("/api/v1/versions/:version/file-tree", ({ baseUrl, response }) => {
  const parsedBaseUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/versions/:version/file-tree`;

  if (typeof response === "function") {
    return [
      ["GET", parsedBaseUrl, response],
    ];
  }

  return [
    ["GET", `${baseUrl.replace(/\/$/, "")}/api/v1/versions/:version/file-tree`, () => {
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
  ];
});
