import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId", () => {
  it("renders the source file page through the generated route tree", async () => {
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
                {
                  id: "backup-pipeline",
                  name: "",
                  description: "Fallback path",
                  versions: ["16.0.0"],
                  routeCount: 2,
                  sourceCount: 1,
                  sourceId: "local",
                },
              ],
            },
          ],
        });
      }],
    ]);

    const { history } = await renderFileRoute("/s/local/alpha");

    expect(await screen.findByText("Alpha file")).toBeInTheDocument();
    expect(screen.getAllByText("Local Source")).toHaveLength(2);
    expect(screen.getByText("2 pipelines")).toBeInTheDocument();
    expect(screen.getByText("src/alpha.ts")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Main pipeline/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /backup-pipeline/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /Main pipeline/i }).every((link) => link.getAttribute("href") === "/s/local/alpha/main-pipeline")).toBe(true);
    expect(screen.getAllByRole("link", { name: /backup-pipeline/i }).every((link) => link.getAttribute("href") === "/s/local/alpha/backup-pipeline")).toBe(true);
    expect(history.location.pathname).toBe("/s/local/alpha");
  });
});
