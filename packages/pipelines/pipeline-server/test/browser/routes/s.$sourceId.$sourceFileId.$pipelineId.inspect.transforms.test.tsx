import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

function defaultRoutes() {
  return [
    {
      id: "compile",
      cache: true,
      depends: [],
      filter: "compile-filter",
      outputs: [],
      transforms: ["normalize"],
    },
    {
      id: "publish",
      cache: false,
      depends: [{ type: "route", routeId: "compile" }],
      filter: "publish-filter",
      outputs: [],
      transforms: ["ship", "normalize"],
    },
  ];
}

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect/transforms", () => {
  beforeEach(() => {
    const routes = defaultRoutes();

    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({
        workspaceId: "workspace-123",
        version: "16.0.0",
      })],
      ["GET", "/api/sources", () => HttpResponse.json([
        {
          id: "local",
          type: "local",
          label: "Local Source",
          fileCount: 1,
          pipelineCount: 1,
          errors: [],
        },
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json({
        id: "local",
        type: "local",
        label: "Local Source",
        errors: [],
        files: [
          {
            id: "alpha",
            path: "src/alpha.ts",
            label: "Alpha file",
            pipelines: [
              {
                id: "main-pipeline",
                name: "Main pipeline",
                description: "Build and publish",
                versions: ["16.0.0"],
                routeCount: routes.length,
                sourceCount: 1,
                sourceId: "local",
              },
            ],
          },
        ],
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
          include: undefined,
          versions: ["16.0.0"],
          routeCount: routes.length,
          sourceCount: 1,
          routes,
          sources: [{ id: "local" }],
        },
      })],
    ]);
  });

  it("auto-redirects from /inspect/transforms to the first transform", async () => {
    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/transforms" });

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect/transforms/normalize");
    });
  });

  it("renders the transform detail page with route count", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/transforms/normalize" });

    await waitFor(() => {
      expect(screen.getAllByText("2 routes").length).toBeGreaterThan(0);
    });
  });

  it("shows also-used-with section when co-transforms exist", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/transforms/normalize" });

    await waitFor(() => {
      expect(screen.getByText("Also used with")).toBeInTheDocument();
    });
  });

  it("renders the empty transforms fallback when no transforms exist", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({
        workspaceId: "workspace-123",
        version: "16.0.0",
      })],
      ["GET", "/api/sources", () => HttpResponse.json([
        {
          id: "local",
          type: "local",
          label: "Local Source",
          fileCount: 1,
          pipelineCount: 1,
          errors: [],
        },
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json({
        id: "local",
        type: "local",
        label: "Local Source",
        errors: [],
        files: [
          {
            id: "alpha",
            path: "src/alpha.ts",
            label: "Alpha file",
            pipelines: [
              {
                id: "main-pipeline",
                name: "Main pipeline",
                description: "Build and publish",
                versions: ["16.0.0"],
                routeCount: 1,
                sourceCount: 1,
                sourceId: "local",
              },
            ],
          },
        ],
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
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 1,
          sourceCount: 1,
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              filter: "compile-filter",
              outputs: [],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/transforms" });

    expect(await screen.findByText("No transforms defined in this pipeline.")).toBeInTheDocument();
  });

  it("shows the transform chain for routes with multiple transforms", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline/inspect/transforms/normalize" });

    await waitFor(() => {
      expect(screen.getByText("Transform chain")).toBeInTheDocument();
    });
  });
});
