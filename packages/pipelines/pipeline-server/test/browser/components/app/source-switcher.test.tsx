import { SourceSwitcher } from "#components/app/source-switcher";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderFileRoute } from "../../route-test-utils";

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourceSwitcher", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([
        {
          id: "local",
          type: "local" as const,
          label: "Local Source",
          fileCount: 2,
          pipelineCount: 4,
          errors: [],
        },
        {
          id: "github",
          type: "github" as const,
          label: "GitHub Source",
          fileCount: 1,
          pipelineCount: 2,
          errors: [],
        },
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json({
        id: params.sourceId,
        type: params.sourceId === "github" ? "github" : "local",
        label: params.sourceId === "github" ? "GitHub Source" : "Local Source",
        errors: [],
        files: [],
      })],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
    ]);
  });

  it("shows the current source label when a source is selected", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/github" });

    expect(await screen.findByTestId("source-switcher-trigger")).toHaveTextContent("GitHub Source");
    expect(screen.getByText("1 file")).toBeInTheDocument();
  });

  it("lists sources in the dropdown and navigates on selection", async () => {
    const user = userEvent.setup();
    const { router } = await renderFileRoute(<div />, { initialLocation: "/s/local" });

    await screen.findByTestId("source-switcher-trigger");

    const navigateSpy = vi.spyOn(router, "navigate").mockImplementation(async () => {});

    expect(screen.getByTestId("source-switcher-trigger")).toHaveTextContent("Local Source");

    await user.click(screen.getByTestId("source-switcher-trigger"));

    expect(await screen.findByTestId("source-switcher-option:local")).toHaveTextContent("Local Source");
    expect(screen.getByTestId("source-switcher-option:github")).toHaveTextContent("GitHub Source");

    await user.click(screen.getByTestId("source-switcher-option:github"));

    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/s/$sourceId",
        params: { sourceId: "github" },
      }),
    );
  });
});
