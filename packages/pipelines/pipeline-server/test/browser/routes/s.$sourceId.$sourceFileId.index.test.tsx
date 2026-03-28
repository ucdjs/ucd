import { HttpResponse, mockFetch } from "#test-utils/msw";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildOverviewResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId", () => {
  it("redirects back to the source route", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    const { history } = await renderFileRoute(<div />, {
      initialLocation: "/s/local/alpha",
    });

    expect(history.location.pathname).toBe("/s/local");
  });
});
