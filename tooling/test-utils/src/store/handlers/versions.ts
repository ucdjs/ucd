import { HttpResponse } from "../../msw/msw";
import { defineMockFetchHandler } from "./define";

export default defineMockFetchHandler(({ baseUrl, response }) => {
  const versionsResponse = response === true
    ? [
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
      ]
    : response;

  return [
    [
      "GET",
      `${baseUrl}/api/v1/versions`,
      () => HttpResponse.json(versionsResponse),
    ],
  ];
});
