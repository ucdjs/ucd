import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/executions", () => {
  it("renders the executions page with direct graph links and the streamlined header", async () => {
    mockFetch([
      ["GET", "/api/config", () => {
        return HttpResponse.json({
          workspaceId: "workspace-123",
          version: "16.0.0",
        });
      }],
      ["GET", "/api/sources", () => {
        return HttpResponse.json([
          {
            id: "local",
            type: "local",
            label: "Local Source",
            fileCount: 1,
            pipelineCount: 1,
            errors: [],
          },
        ]);
      }],
      ["GET", "/api/sources/local", () => {
        return HttpResponse.json({
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
                  versions: ["16.0.0", "15.1.0"],
                  routeCount: 8,
                  sourceCount: 3,
                  sourceId: "local",
                },
              ],
            },
          ],
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => {
        return HttpResponse.json({
          pipeline: {
            id: "main-pipeline",
            name: "Main pipeline",
            description: "Build and publish",
            include: undefined,
            versions: ["16.0.0", "15.1.0"],
            routeCount: 2,
            sourceCount: 1,
            routes: [
              {
                id: "compile",
                cache: true,
                depends: [],
                emits: [],
                filter: undefined,
                outputs: [],
                transforms: ["normalize"],
              },
              {
                id: "publish",
                cache: false,
                depends: [{ type: "route", routeId: "compile" }],
                emits: [{ id: "bundle", scope: "version" }],
                filter: undefined,
                outputs: [{ dir: "dist", fileName: "bundle.txt" }],
                transforms: [],
              },
            ],
            sources: [{ id: "local" }],
          },
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");

        return HttpResponse.json({
          executions: [
            {
              id: "exec-1",
              sourceId: "local",
              fileId: "alpha",
              pipelineId: "main-pipeline",
              status: "completed",
              startedAt: "2026-03-20T10:00:00.000Z",
              completedAt: "2026-03-20T10:01:00.000Z",
              versions: ["16.0.0"],
              summary: {
                versions: ["16.0.0"],
                totalRoutes: 2,
                cached: 1,
                totalFiles: 10,
                matchedFiles: 8,
                skippedFiles: 1,
                fallbackFiles: 1,
                totalOutputs: 4,
                durationMs: 60000,
              },
              hasGraph: true,
              error: null,
            },
          ],
          pagination: {
            total: 1,
            limit,
            offset: 0,
            hasMore: false,
          },
        });
      }],
    ]);

    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/executions");

    expect(await screen.findByText("1 total runs")).toBeInTheDocument();
    expect(screen.getAllByText("Main pipeline")).not.toHaveLength(0);
    expect(screen.getByText("Alpha file")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Executions" })).toHaveAttribute("href", "/s/local/alpha/main-pipeline/executions");
    expect(screen.queryByRole("tab", { name: "Graphs" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Versions/i })).toBeInTheDocument();
    expect(screen.getByText("exec-1")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View graph/i })[0]).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1/graph",
    );
    expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/executions");
  });

  it("renders the empty executions state when there are no runs", async () => {
    mockFetch([
      ["GET", "/api/config", () => {
        return HttpResponse.json({
          workspaceId: "workspace-123",
          version: "16.0.0",
        });
      }],
      ["GET", "/api/sources", () => {
        return HttpResponse.json([
          {
            id: "local",
            type: "local",
            label: "Local Source",
            fileCount: 1,
            pipelineCount: 1,
            errors: [],
          },
        ]);
      }],
      ["GET", "/api/sources/local", () => {
        return HttpResponse.json({
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
                  versions: ["16.0.0", "15.1.0"],
                  routeCount: 8,
                  sourceCount: 3,
                  sourceId: "local",
                },
              ],
            },
          ],
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => {
        return HttpResponse.json({
          pipeline: {
            id: "main-pipeline",
            name: "Main pipeline",
            description: "Build and publish",
            include: undefined,
            versions: ["16.0.0", "15.1.0"],
            routeCount: 0,
            sourceCount: 1,
            routes: [],
            sources: [{ id: "local" }],
          },
        });
      }],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");

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
    ]);

    await renderFileRoute("/s/local/alpha/main-pipeline/executions");

    expect(await screen.findByText("0 total runs")).toBeInTheDocument();
    expect(screen.getByText("No executions yet")).toBeInTheDocument();
    expect(screen.getByText("Execute the pipeline to see results here")).toBeInTheDocument();
  });
});
