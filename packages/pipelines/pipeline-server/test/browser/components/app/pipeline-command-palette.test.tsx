import { HttpResponse, mockFetch } from "#test-utils/msw";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  buildConfigResponse,
  buildOverviewResponse,
  buildPipelineResponse,
  buildSourceResponse,
  buildSourceSummary,
} from "../../fixtures";
import {
  dispatchModHotkey,
  getTestHotkeyManager,
  renderFileRoute,
} from "../../route-test-utils";

describe("pipeline command palette", () => {
  it("registers Mod+K on a pipeline route and opens from a real keyboard event", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
      ["GET", "/api/sources/local/files/alpha/pipelines/main-pipeline", () => HttpResponse.json(buildPipelineResponse())],
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

    await renderFileRoute(<div />, {
      initialLocation: "/s/local/alpha/main-pipeline",
      useRealCommandPalette: true,
    });

    const manager = getTestHotkeyManager();

    await waitFor(() => {
      expect(manager.isRegistered("Mod+K")).toBe(true);
    });

    await act(async () => {
      dispatchModHotkey("k");
    });

    const input = await screen.findByTestId("pipeline-command-palette-input");
    const dialog = input.closest("[data-slot='dialog-content']");

    expect(dialog).not.toBeNull();
    expect(within(dialog!).getByText("Current Pipeline")).toBeInTheDocument();
    expect(within(dialog!).getByText("Execute current pipeline")).toBeInTheDocument();
    expect(within(dialog!).getByText("Open current pipeline")).toBeInTheDocument();
    expect(within(dialog!).getByText("Inspect current pipeline")).toBeInTheDocument();
  });

  it("does not show current-pipeline actions on non-pipeline routes and surfaces the no-results state", async () => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json(buildConfigResponse())],
      ["GET", "/api/sources", () => HttpResponse.json([
        buildSourceSummary(),
      ])],
      ["GET", "/api/sources/local", () => HttpResponse.json(buildSourceResponse())],
      ["GET", "/api/sources/local/overview", () => HttpResponse.json(buildOverviewResponse())],
    ]);

    const user = userEvent.setup();

    await renderFileRoute(<div />, {
      initialLocation: "/",
      useRealCommandPalette: true,
    });

    const manager = getTestHotkeyManager();

    await waitFor(() => {
      expect(manager.isRegistered("Mod+K")).toBe(true);
    });

    await act(async () => {
      dispatchModHotkey("k");
    });

    const input = await screen.findByTestId("pipeline-command-palette-input");
    const dialog = input.closest("[data-slot='dialog-content']");

    expect(dialog).not.toBeNull();
    expect(within(dialog!).queryByText("Current Pipeline")).not.toBeInTheDocument();

    await user.type(input, "does-not-exist");

    expect(await within(dialog!).findByText("No results found.")).toBeInTheDocument();
  });
});
