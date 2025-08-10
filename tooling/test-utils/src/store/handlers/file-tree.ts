import { HttpResponse } from "../../msw/msw";
import { defineMockFetchHandler } from "./define";

export default defineMockFetchHandler(({ baseUrl, response }) => {
  const fileTreeResponse = response === true
    ? [
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
      ]
    : response;

  return [
    [
      "GET",
      `${baseUrl}/api/v1/versions/:version/file-tree`,
      () => HttpResponse.json(fileTreeResponse),
    ],
  ];
});
