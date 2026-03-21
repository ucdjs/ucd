import type { ReactNode } from "react";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderFileRoute } from "../route-test-utils";

vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: ({
      nodes,
      onNodeClick,
      onPaneClick,
      children,
    }: {
      nodes: Array<{ id: string; data?: { graphNode?: { label?: string } } }>;
      onNodeClick?: (event: unknown, node: unknown) => void;
      onPaneClick?: () => void;
      children?: ReactNode;
    }) => (
      <div data-testid="mock-react-flow">
        <button type="button" onClick={() => onPaneClick?.()}>Close graph details</button>
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onNodeClick?.({}, node)}
          >
            {node.data?.graphNode?.label ?? node.id}
          </button>
        ))}
        {children}
      </div>
    ),
    Background: () => <div>Background</div>,
    Controls: () => <div>Controls</div>,
    MiniMap: () => <div>MiniMap</div>,
    applyEdgeChanges: (_changes: unknown, edges: unknown) => edges,
    applyNodeChanges: (_changes: unknown, nodes: unknown) => nodes,
  };
});

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId/graph", () => {
  it("renders the empty state when no execution graph exists", async () => {
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
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json({
        pipeline: {
          id: "main-pipeline",
          name: "Main pipeline",
          description: "Build and publish",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 1,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "1");

        return HttpResponse.json({
          executions: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            hasMore: false,
          },
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/graph", () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "completed",
        graph: null,
      })],
    ]);

    await renderFileRoute("/s/local/alpha/main-pipeline/executions/exec-1/graph");

    expect(await screen.findByText("Execution exec-1 graph")).toBeInTheDocument();
    expect(screen.getByText("Back to execution")).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1",
    );
    expect(await screen.findByText("No graph recorded for this execution.")).toBeInTheDocument();
  });

  it("renders the graph view, exposes filters, and navigates through node actions", async () => {
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
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json({
        pipeline: {
          id: "main-pipeline",
          name: "Main pipeline",
          description: "Build and publish",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 1,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "1");

        return HttpResponse.json({
          executions: [],
          pagination: {
            total: 0,
            limit,
            offset: 0,
            hasMore: false,
          },
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions/exec-1/graph", () => HttpResponse.json({
        executionId: "exec-1",
        pipelineId: "main-pipeline",
        status: "completed",
        graph: {
          nodes: [
            {
              id: "route:compile",
              nodeType: "route",
              flowType: "pipeline-route",
              label: "compile",
              detailFields: [
                {
                  label: "Route ID",
                  type: "text",
                  value: "compile",
                },
              ],
              actions: [
                {
                  label: "Open compile",
                  to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
                  params: {
                    sourceId: "local",
                    sourceFileId: "alpha",
                    pipelineId: "main-pipeline",
                  },
                  search: {
                    route: "compile",
                  },
                },
              ],
            },
          ],
          edges: [],
        },
      })],
    ]);

    const user = userEvent.setup();
    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/executions/exec-1/graph");

    expect(await screen.findByText("Execution exec-1 graph")).toBeInTheDocument();
    expect(await screen.findByTestId("pipeline-graph")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-graph-filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Route" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "compile" }));

    expect(screen.getByTestId("pipeline-graph-details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open compile" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open compile" }));

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect");
      expect(history.location.search).toContain("route=compile");
    });
  });
});
