import type { ComponentProps, ReactNode } from "react";
import { ExecutionTable } from "#components/execution/execution-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({
      children,
      to,
      params,
      ...props
    }: {
      children: ReactNode;
      to: string;
      params: Record<string, string>;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const href = to
        .replace("$sourceId", params.sourceId ?? "")
        .replace("$sourceFileId", params.sourceFileId ?? "")
        .replace("$pipelineId", params.pipelineId ?? "")
        .replace("$executionId", params.executionId ?? "");

      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  };
});

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

describe("executionTable", () => {
  it("renders the empty state messaging when there are no executions", () => {
    render(
      <ExecutionTable
        executions={[]}
        emptyTitle="No runs yet"
        emptyDescription="Kick off a run to populate this list."
      />,
    );

    expect(screen.getByText("No runs yet")).toBeInTheDocument();
    expect(screen.getByText("Kick off a run to populate this list.")).toBeInTheDocument();
  });

  it("shows the pipeline column and graph link only when enabled", () => {
    render(
      <ExecutionTable
        executions={[execution]}
        emptyTitle="No runs yet"
        showPipelineColumn
        showGraphLink
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Pipeline" })).toBeInTheDocument();
    expect(screen.getByText("main-pipeline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1",
    );
    expect(screen.getByRole("link", { name: "View Graph" })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-1/graph",
    );
  });

  it("falls back when route data, versions, or summary are missing", () => {
    render(
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
    expect(screen.queryByRole("link", { name: "View Graph" })).not.toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(3);
  });
});
