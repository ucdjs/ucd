import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function mockInspectApi() {
  mockFetch([
    ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
    ["GET", "/api/sources", () => HttpResponse.json([
      { id: "local", type: "local", label: "Local Source", fileCount: 1, pipelineCount: 1, errors: [] },
    ])],
    ["GET", "/api/sources/local", () => HttpResponse.json({
      id: "local",
      type: "local",
      label: "Local Source",
      errors: [],
      files: [{
        id: "alpha",
        path: "src/alpha.ts",
        label: "Alpha file",
        pipelines: [{ id: "main-pipeline", name: "Main pipeline", description: "Build and publish", versions: ["16.0.0"], routeCount: 3, sourceCount: 1, sourceId: "local" }],
      }],
    })],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json({
      executions: [],
      pagination: { total: 0, limit: 1, offset: 0, hasMore: false },
    })],
    ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json({
      pipeline: {
        id: "main-pipeline",
        name: "Main pipeline",
        description: "Build and publish",
        include: "**/*.txt",
        versions: ["16.0.0"],
        routeCount: 3,
        sourceCount: 1,
        routes: [
          { id: "compile", cache: true, depends: [], filter: "compile-filter", outputs: [{ id: "compile-out", sink: "file", format: "json", dir: "dist", fileName: "compile.json" }], transforms: ["normalize", "dedupe"] },
          { id: "publish", cache: false, depends: [{ type: "route", routeId: "compile" }], filter: "publish-filter", outputs: [{ id: "publish-out", sink: "file", format: "text", dir: "dist", fileName: "bundle.txt" }], transforms: ["ship"] },
          { id: "archive", cache: false, depends: [{ type: "route", routeId: "publish" }], filter: "archive-filter", outputs: [], transforms: [] },
        ],
        sources: [{ id: "local" }],
      },
    })],
  ]);
}

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect", () => {
  it("redirects /inspect to /inspect/routes", async () => {
    mockInspectApi();
    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect" });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect/routes/compile");
    });
  });

  it("auto-redirects from /inspect/routes to the first route", async () => {
    mockInspectApi();
    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/routes" });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect/routes/compile");
    });
  });

  it("renders the sidebar with tab links", async () => {
    mockInspectApi();
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/routes/compile" });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Search inspect items" })).toBeInTheDocument();
    });
  });

  it("renders the route detail view for a selected route", async () => {
    mockInspectApi();
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/routes/compile" });

    await waitFor(() => {
      expect(screen.getByText("compile-filter")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Cacheable").length).toBeGreaterThan(0);
  });

  it("filters the sidebar route list with the search input", async () => {
    mockInspectApi();
    const user = userEvent.setup();
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/routes/compile" });

    const searchInput = await screen.findByRole("textbox", { name: "Search inspect items" });
    await user.type(searchInput, "archive");

    await waitFor(() => {
      expect(screen.queryByText("No routes match the current filter.")).not.toBeInTheDocument();
    });

    await user.clear(searchInput);
    await user.type(searchInput, "nonexistent");

    await waitFor(() => {
      expect(screen.getByText("No routes match the current filter.")).toBeInTheDocument();
    });
  });

  it("navigates between routes via sidebar links", async () => {
    mockInspectApi();
    const user = userEvent.setup();
    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/routes/compile" });

    await screen.findByText("compile-filter");

    const publishLinks = screen.getAllByText("publish");
    const sidebarLink = publishLinks.find((el) => el.closest("a"));
    expect(sidebarLink).toBeDefined();
    await user.click(sidebarLink!);

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect/routes/publish");
    });
  });
});
