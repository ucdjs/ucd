import type { ReactNode } from "react";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hotkeys = vi.hoisted(() => new Map<string, (event: { preventDefault: () => void }) => void>());
const mockedExecute = vi.hoisted(() => vi.fn());
const executeState = vi.hoisted(() => ({
  executing: false,
  executionId: null as string | null,
}));

vi.mock("@tanstack/react-hotkeys", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    HotkeysProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useHotkey: (
      shortcut: string,
      handler: (event: { preventDefault: () => void }) => void,
      options?: { enabled?: boolean },
    ) => {
      React.useEffect(() => {
        if (options?.enabled === false) {
          hotkeys.delete(shortcut);
          return;
        }

        hotkeys.set(shortcut, handler);

        return () => {
          if (hotkeys.get(shortcut) === handler) {
            hotkeys.delete(shortcut);
          }
        };
      }, [shortcut, handler, options?.enabled]);
    },
  };
});

vi.mock("#hooks/use-execute", () => {
  return {
    useExecute: () => ({
      execute: mockedExecute,
      executing: executeState.executing,
      executionId: executeState.executionId,
    }),
  };
});

describe("pipeline command palette", () => {
  beforeEach(() => {
    hotkeys.clear();
    mockedExecute.mockReset();
    executeState.executing = false;
    executeState.executionId = null;
    vi.resetModules();
    vi.doMock("#components/app/pipeline-command-palette", async () =>
      vi.importActual("#components/app/pipeline-command-palette"));
  });

  afterEach(() => {
    vi.doMock("#components/app/pipeline-command-palette", () => ({
      PipelineCommandPalette: () => null,
    }));
  });

  it("opens on a pipeline route, exposes current actions, and uses stored versions for execute-current", async () => {
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
                versions: ["16.0.0", "15.1.0"],
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
          versions: ["16.0.0", "15.1.0"],
          routeCount: 2,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline/executions", () => HttpResponse.json({
        executions: [],
        pagination: {
          total: 0,
          limit: 12,
          offset: 0,
          hasMore: false,
        },
      })],
    ]);

    localStorage.setItem("ucd-versions-local:alpha:main-pipeline", JSON.stringify(["15.1.0"]));

    const { renderFileRoute } = await import("../route-test-utils");

    await renderFileRoute("/s/local/alpha/main-pipeline");

    await waitFor(() => {
      expect(hotkeys.has("Mod+K")).toBe(true);
    });

    await act(async () => {
      hotkeys.get("Mod+K")?.({ preventDefault() {} });
    });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).not.toBeNull();
    });

    const dialog = document.querySelector("[data-slot='dialog-content']") as HTMLElement;
    const textbox = dialog.querySelector("[data-slot='command-input']") as HTMLInputElement | null;

    expect(textbox).not.toBeNull();
    expect(within(dialog).getByText("Current Pipeline")).toBeInTheDocument();
    expect(within(dialog).getByText("Execute current pipeline")).toBeInTheDocument();
    expect(within(dialog).getByText("Open current pipeline")).toBeInTheDocument();

    await waitFor(() => {
      expect(hotkeys.has("Mod+E")).toBe(true);
    });

    await act(async () => {
      hotkeys.get("Mod+E")?.({ preventDefault() {} });
    });

    await waitFor(() => {
      expect(mockedExecute).toHaveBeenCalledWith("local", "alpha", "main-pipeline", ["15.1.0"]);
    });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
  });

  it("does not show current-pipeline actions on non-pipeline routes and surfaces the no-results state", async () => {
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
      ["GET", "/api/overview", () => HttpResponse.json({
        activity: [],
        summary: {
          total: 0,
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
        recentExecutions: [],
      })],
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
    ]);

    const user = userEvent.setup();
    const { renderFileRoute } = await import("../route-test-utils");

    await renderFileRoute("/");

    await waitFor(() => {
      expect(hotkeys.has("Mod+K")).toBe(true);
    });

    await act(async () => {
      hotkeys.get("Mod+K")?.({ preventDefault() {} });
    });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).not.toBeNull();
    });

    const dialog = document.querySelector("[data-slot='dialog-content']") as HTMLElement;
    const textbox = dialog.querySelector("[data-slot='command-input']") as HTMLInputElement | null;

    expect(textbox).not.toBeNull();
    expect(within(dialog).queryByText("Current Pipeline")).not.toBeInTheDocument();

    await user.type(textbox!, "does-not-exist");

    expect(await within(dialog).findByText("No results found.")).toBeInTheDocument();
  });
});
