import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildExecutionsResponse,
  buildOverviewResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

describe("loader-driven not found handling", () => {
  it("renders the not-found path for an invalid source", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/missing", () => HttpResponse.json({ message: "Missing source" }, { status: 404 })],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/missing" });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it("renders the not-found path for an invalid file", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
      ["GET", "/api/sources/local/files/missing-file/pipelines/main-pipeline", () =>
        HttpResponse.json({ message: "Missing pipeline" }, { status: 404 })],
      ["GET", "/api/sources/local/files/missing-file/pipelines/main-pipeline/executions", () =>
        HttpResponse.json(buildExecutionsResponse([], {
          pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
        }))],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/missing-file/main-pipeline" });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it("renders the not-found path for an invalid pipeline", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/files/alpha/pipelines/missing-pipeline", () =>
        HttpResponse.json({ message: "Missing pipeline" }, { status: 404 })],
      ["GET", "/api/sources/local/files/alpha/pipelines/missing-pipeline/executions", () =>
        HttpResponse.json(buildExecutionsResponse([], {
          pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
        }))],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/missing-pipeline" });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
