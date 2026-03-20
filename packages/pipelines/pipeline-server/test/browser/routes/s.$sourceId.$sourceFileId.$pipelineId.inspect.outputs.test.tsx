import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs", () => {
  it("selects outputs from search params, expands route groups, and links back to inspect", async () => {
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
    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/inspect/outputs?output=publish:0");

    expect(await screen.findByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.replace(/\s+/g, " ").trim() === "publish output1",
    )).toBeInTheDocument();
    expect(screen.getByText("Output definition for where this route writes artifacts.")).toBeInTheDocument();

    const outputsSection = screen.getByRole("heading", { name: "Pipeline outputs" }).closest("section");
    expect(outputsSection).not.toBeNull();

    const compileGroup = within(outputsSection!).getAllByRole("button").find((button) =>
      button.textContent?.replace(/\s+/g, " ").trim().includes("compile")
      && button.textContent.includes("2 outputs"),
    );
    expect(compileGroup).not.toBeNull();
    await user.click(compileGroup!);
    expect(within(outputsSection!).getAllByRole("button").some((button) => button.textContent?.includes("compile.json"))).toBe(true);
    expect(within(outputsSection!).getAllByRole("button").some((button) => button.textContent?.includes("compile.txt"))).toBe(true);

    await user.click(compileGroup!);
    expect(screen.queryByText("compile.json")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Open publish" }));

    await waitFor(() => {
      expect(history.location.pathname).toBe("/s/local/alpha/main-pipeline/inspect");
      expect(history.location.search).toContain("route=publish");
    });
  });

  it("renders the empty outputs state when the pipeline has no outputs", async () => {
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

    await renderFileRoute("/s/local/alpha/main-pipeline/inspect/outputs");

    expect(await screen.findByText("No outputs defined")).toBeInTheDocument();
  });
});
