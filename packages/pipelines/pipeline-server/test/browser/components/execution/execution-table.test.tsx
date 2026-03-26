import type { ComponentProps, ReactNode } from "react";
import { ExecutionTable } from "#components/execution/execution-table";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderComponent } from "../../route-test-utils";

const execution = {
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
    totalRoutes: 4,
    cached: 2,
    totalFiles: 10,
    matchedFiles: 8,
    skippedFiles: 1,
    fallbackFiles: 1,
    totalOutputs: 2,
    durationMs: 60_000,
  },
  hasGraph: true,
  error: null,
} satisfies ComponentProps<typeof ExecutionTable>["executions"][number];

// eslint-disable-next-line test/prefer-lowercase-title
describe("ExecutionTable", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([])],
    ]);
  });
  it("renders the empty state messaging when there are no executions", async () => {
    await renderComponent(
      <ExecutionTable
        executions={[]}
        emptyTitle="No runs yet"
        emptyDescription="Kick off a run to populate this list."
      />,
    );

    expect(screen.getByText("No runs yet")).toBeInTheDocument();
    expect(screen.getByText("Kick off a run to populate this list.")).toBeInTheDocument();
  });

  it("shows the pipeline column and graph link only when enabled", async () => {
    await renderComponent(
      <ExecutionTable
        executions={[execution]}
        emptyTitle="No runs yet"
        showPipelineColumn
        showGraphLink
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Pipeline" })).toBeInTheDocument();
    expect(screen.getAllByText("main-pipeline")).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "View" })[0]).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1",
    );
    expect(screen.getAllByRole("link", { name: /View graph/i })[0]).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1/graph",
    );
  });

  it("falls back when route data, versions, or summary are missing", async () => {
    await renderComponent(
      <ExecutionTable
        executions={[{
          ...execution,
          sourceId: null,
          fileId: null,
          versions: null,
          summary: null,
          hasGraph: false,
        }]}
        emptyTitle="No runs yet"
      />,
    );

    expect(screen.queryByRole("link", { name: "View" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View graph/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("-")).not.toHaveLength(0);
  });
});
