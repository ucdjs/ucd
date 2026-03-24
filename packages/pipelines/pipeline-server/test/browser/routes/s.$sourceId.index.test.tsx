import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId", () => {
  it("renders the source route through the generated route tree", async () => {
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
            pipelineCount: 2,
            errors: [
              {
                code: "missing-meta",
                scope: "source",
                message: "Missing metadata",
                relativePath: "src/alpha.ts",
              },
            ],
          },
        ]);
      }],
      ["GET", "/api/sources/local", () => {
        return HttpResponse.json({
          id: "local",
          type: "local",
          label: "Local Source",
          errors: [
            {
              code: "missing-meta",
              scope: "source",
              message: "Missing metadata",
              relativePath: "src/alpha.ts",
            },
          ],
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
                  routeCount: 3,
                  sourceCount: 1,
                  sourceId: "local",
                },
              ],
            },
          ],
        });
      }],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
    ]);

    const { history } = await renderFileRoute(<div />, { initialLocation: "/s/local" });
    expect((await screen.findAllByText("Local Source")).length).toBeGreaterThan(0);
    expect(history.location.pathname).toBe("/s/local");
  });
});
