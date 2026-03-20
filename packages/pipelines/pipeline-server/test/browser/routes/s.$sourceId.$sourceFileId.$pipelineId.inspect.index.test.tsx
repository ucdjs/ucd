import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("file-based route /s/$sourceId/$sourceFileId/$pipelineId/inspect", () => {
  it("renders the routes view by default and filters the route list", async () => {
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
                routeCount: 3,
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
          include: "**/*.txt",
          versions: ["16.0.0"],
          routeCount: 3,
          sourceCount: 1,
          routes: [
            {
              id: "compile",
              cache: true,
              depends: [],
              emits: [{ id: "parsed-data", scope: "version" }],
              filter: "compile-filter",
              outputs: [{ dir: "dist", fileName: "compile.json" }],
              transforms: ["normalize", "dedupe"],
            },
            {
              id: "publish",
              cache: false,
              depends: [{ type: "route", routeId: "compile" }],
              emits: [{ id: "bundle", scope: "version" }],
              filter: "publish-filter",
              outputs: [{ dir: "dist", fileName: "bundle.txt" }],
              transforms: ["ship"],
            },
            {
              id: "archive",
              cache: false,
              depends: [{ type: "route", routeId: "publish" }],
              emits: [],
              filter: "archive-filter",
              outputs: [],
              transforms: [],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    const user = userEvent.setup();
    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/inspect?route=publish");

    expect(await screen.findByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.trim() === "Inspect"
    )).toBeInTheDocument();

    const inspectShell = screen.getByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.trim() === "Inspect"
    ).closest("[data-slot='card']") as HTMLElement | null;
    expect(inspectShell).not.toBeNull();

    expect(screen.getByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.trim() === "publish"
    )).toBeInTheDocument();
    expect(screen.getByText("Route dependencies, transforms, and output definitions.")).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Search inspect routes" }));
    await user.type(screen.getByRole("textbox", { name: "Search inspect routes" }), "archive");

    expect(within(inspectShell!).getAllByRole("button").some((button) =>
      button.textContent?.replace(/\s+/g, " ").trim().startsWith("archive")
    )).toBe(true);
    expect(within(inspectShell!).getAllByRole("button").some((button) =>
      button.textContent?.replace(/\s+/g, " ").trim().startsWith("compile")
    )).toBe(false);

    await user.clear(screen.getByRole("textbox", { name: "Search inspect routes" }));
    await user.type(screen.getByRole("textbox", { name: "Search inspect routes" }), "missing");

    expect(screen.getByText("No routes match the current filter.")).toBeInTheDocument();
    expect(history.location.search).toContain("route=publish");
  });

  it("switches views inside the inspect shell using search state", async () => {
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
              outputs: [{ dir: "dist", fileName: "compile.json" }],
              transforms: ["normalize"],
            },
            {
              id: "publish",
              cache: false,
              depends: [{ type: "route", routeId: "compile" }],
              emits: [],
              filter: "publish-filter",
              outputs: [{ dir: "dist", fileName: "bundle.txt" }],
              transforms: ["ship"],
            },
          ],
          sources: [{ id: "local" }],
        },
      })],
    ]);

    const user = userEvent.setup();
    const { history } = await renderFileRoute("/s/local/alpha/main-pipeline/inspect");

    const inspectShell = screen.getByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.trim() === "Inspect"
    ).closest("[data-slot='card']") as HTMLElement | null;
    expect(inspectShell).not.toBeNull();

    const transformsViewButton = within(inspectShell!).getAllByRole("button").find((button) =>
      button.textContent?.trim() === "transforms"
    );
    expect(transformsViewButton).not.toBeNull();
    await user.click(transformsViewButton!);

    expect(await screen.findByText((_, element) =>
      element?.getAttribute("data-slot") === "card-title"
      && element.textContent?.trim() === "normalize"
    )).toBeInTheDocument();
    expect(history.location.search).toContain("view=transforms");

    const outputsViewButton = within(inspectShell!).getAllByRole("button").find((button) =>
      button.textContent?.trim() === "outputs"
    );
    expect(outputsViewButton).not.toBeNull();
    await user.click(outputsViewButton!);

    await waitFor(() => {
      expect(screen.getByText((_, element) =>
        element?.getAttribute("data-slot") === "card-title"
        && element.textContent?.replace(/\s+/g, " ").trim() === "compile output1"
      )).toBeInTheDocument();
      expect(history.location.search).toContain("view=outputs");
    });
  });
});
