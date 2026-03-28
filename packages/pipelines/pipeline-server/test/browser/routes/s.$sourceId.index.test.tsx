import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildExecutionSummaryItem,
  buildOverviewResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../fixtures";
import { renderFileRoute } from "../route-test-utils";

const sourceIssues = [
  {
    code: "missing-meta",
    scope: "source",
    message: "Missing metadata",
    relativePath: "src/alpha.ts",
  },
];

describe("file-based route /s/$sourceId", () => {
  it("renders the source route, stores the last active source, and shows issue details", async () => {
    const user = userEvent.setup();

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary({
          errors: sourceIssues,
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse({
        errors: sourceIssues,
      }))],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect((await screen.findAllByText("Local Source")).length).toBeGreaterThan(0);
    expect(localStorage.getItem("ucd-last-active-source")).toBe("local");
    expect(screen.getByText("1 issue detected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View details" }));

    const dialog = await screen.findByTestId("source-issues-dialog");
    expect(within(dialog).getByText("Missing metadata")).toBeInTheDocument();
    expect(within(dialog).getByText("src/alpha.ts")).toBeInTheDocument();
  });

  it("filters files and pipelines, supports view toggles, and renders recent execution links", async () => {
    const user = userEvent.setup();

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary({
          fileCount: 2,
          pipelineCount: 2,
        }),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse({
        files: [
          {
            id: "alpha",
            path: "src/alpha.ts",
            label: "Alpha file",
            pipelines: [
              {
                id: "build-alpha",
                name: "Build alpha",
                description: "Build alpha artifacts",
                versions: ["16.0.0"],
                routeCount: 2,
                sourceCount: 1,
                sourceId: "local",
              },
            ],
          },
          {
            id: "beta",
            path: "src/beta.ts",
            label: "Beta file",
            pipelines: [
              {
                id: "publish-beta",
                name: "Publish beta",
                description: "Publish beta artifacts",
                versions: ["16.0.0"],
                routeCount: 1,
                sourceCount: 1,
                sourceId: "local",
              },
            ],
          },
        ],
      }))],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse({
        recentExecutions: [
          buildExecutionSummaryItem({
            id: "exec-1",
            sourceId: "local",
            fileId: "alpha",
            pipelineId: "build-alpha",
          }),
        ],
      }))],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findByText("Alpha file")).toBeInTheDocument();
    expect(screen.getByText("Beta file")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "true");

    await user.type(screen.getByPlaceholderText("Search files and pipelines..."), "publish");

    expect(screen.queryByText("Alpha file")).not.toBeInTheDocument();
    expect(screen.getByText("Beta file")).toBeInTheDocument();
    expect(screen.getByText("Publish beta")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search files and pipelines..."));
    await user.type(screen.getByPlaceholderText("Search files and pipelines..."), "does-not-exist");

    expect(screen.getByText("No results for \"does-not-exist\"")).toBeInTheDocument();

    const executionLink = screen.getAllByRole("link").find((link) =>
      link.getAttribute("href")?.endsWith("/s/local/alpha/build-alpha/executions/exec-1"));

    expect(executionLink).toBeDefined();
  });
});
