import { HttpResponse, mockFetch } from "#test-utils/msw";
import { QueryClient } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFileRoute } from "../route-test-utils";

describe("root route error handling", () => {
  it("renders the root error component when a page query fails unexpectedly", async () => {
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
        message: "Overview blew up",
      }, { status: 500 })],
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    await renderFileRoute(<div />, { initialLocation: "/", queryClient });

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("The application encountered an unexpected error.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload Application" })).toBeInTheDocument();
  });
});
