import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect output focus", () => {
  it("selects outputs from search params and switches between outputs on the same route", async () => {
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
                routeCount: 2,
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
          routeCount: 2,
          sourceCount: 1,
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              emits: [],
              filter: "compile-filter",
              outputs: [
                { dir: "dist", fileName: "compile.json" },
                { dir: "reports", fileName: "compile.txt" },
              ],
              transforms: [],
            },
            {
              id: "publish",
              cache: false,
              depends: [{ type: "route", routeId: "compile" }],
              emits: [],
              filter: "publish-filter",
              outputs: [{ dir: "release", fileName: "bundle.txt" }],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    const user = userEvent.setup();
    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/inspect?route=compile&output=compile:0");

    expect(await screen.findByRole("heading", { name: /compile output1/i })).toBeInTheDocument();
    expect(screen.getByText("Focused output details for the selected route.")).toBeInTheDocument();
    expect(screen.getByText("compile.json")).toBeInTheDocument();
    expect(screen.getByText("dist")).toBeInTheDocument();

    const routeOutputsSection = screen.getByRole("heading", { name: "Other outputs on this route" }).closest("section");
    expect(routeOutputsSection).not.toBeNull();

    const secondOutputButton = within(routeOutputsSection!).getAllByRole("button").find((button) =>
      button.textContent?.replace(/\s+/g, " ").trim().includes("Output 2")
      && button.textContent.includes("compile.txt"),
    );
    expect(secondOutputButton).not.toBeNull();
    await user.click(secondOutputButton!);

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect");
      expect(history.location.search).toContain("route=compile");
      expect(history.location.search).toContain("output=compile%3A1");
      expect(screen.getByRole("heading", { name: /compile output2/i })).toBeInTheDocument();
    });
  });

  it("renders the empty outputs state when the selected route has no outputs", async () => {
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
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              emits: [],
              filter: "compile-filter",
              outputs: [],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    await renderFileRoute("/s/local/alpha/main-pipeline/inspect?route=compile");

    expect(await screen.findByText("No output definitions for this route.")).toBeInTheDocument();
  });
});
