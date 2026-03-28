import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildOverviewResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /", () => {
  it("redirects to the stored last active source when it still exists", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
        buildSourceSummary({
          id: "gitlab",
          type: "gitlab",
          label: "GitLab Source",
          fileCount: 2,
          pipelineCount: 3,
        }),
      ])],
      ["GET", "/api/sources/gitlab", () => HttpResponse.json(buildSourceResponse({
        id: "gitlab",
        type: "gitlab",
        label: "GitLab Source",
        files: [],
      }))],
      ["GET", "/api/sources/gitlab/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    const { history } = await renderFileRoute(<div />, {
      initialLocation: "/",
      localStorage: {
        "ucd-last-active-source": "gitlab",
      },
    });

    expect(history.location.pathname).toBe("/s/gitlab");
  });

  it("redirects to the first source when storage is missing or invalid", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
        buildSourceSummary({
          id: "gitlab",
          type: "gitlab",
          label: "GitLab Source",
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    const { history } = await renderFileRoute(<div />, {
      initialLocation: "/",
      localStorage: {
        "ucd-last-active-source": "missing-source",
      },
    });

    expect(history.location.pathname).toBe("/s/local");
  });

  it("renders the empty state when no sources are configured", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([])],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/" });

    expect(await screen.findByText("No sources configured")).toBeInTheDocument();
    expect(screen.getByText("Add a source to get started.")).toBeInTheDocument();
  });
});
