import type { PipelineHeaderProps } from "#components/pipeline/pipeline-header";
import type { ReactNode } from "react";
import { PipelineHeader } from "#components/pipeline/pipeline-header";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedNavigate = vi.hoisted(() => vi.fn());
const mockedExecute = vi.hoisted(() => vi.fn());
const executeState = vi.hoisted(() => ({
  executing: false,
  executionId: null as string | null,
}));

vi.mock("#hooks/use-execute", () => {
  return {
    useExecute: () => ({
      execute: mockedExecute,
      executing: executeState.executing,
      executionId: executeState.executionId,
    }),
  };
});

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
    useNavigate: () => mockedNavigate,
    useParams: () => ({
      sourceId: "local",
      sourceFileId: "alpha",
      pipelineId: "main-pipeline",
    }),
  };
});

const pipeline = {
  id: "main-pipeline",
  name: "Main pipeline",
  description: "Build and publish",
  versions: ["16.0.0", "15.1.0"],
  routeCount: 4,
  sourceCount: 2,
  include: undefined,
  routes: [],
  sources: [],
} satisfies PipelineHeaderProps["pipeline"];

describe("pipelineHeader", () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    mockedExecute.mockReset();
    executeState.executing = false;
    executeState.executionId = null;
  });

  it("disables execute when no versions are selected", () => {
    render(
      <PipelineHeader
        selectedVersions={new Set()}
        pipeline={pipeline}
        sourceLabel="Local Source"
        fileLabel="Alpha file"
        filePath="src/alpha.ts"
        latestExecution={null}
        onToggleVersion={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Execute" })).toBeDisabled();
    expect(screen.getByText("Select at least one version to enable execution.")).toBeInTheDocument();
  });

  it("shows the running state while an execution is in progress", () => {
    executeState.executing = true;

    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0"])}
        pipeline={pipeline}
        sourceLabel="Local Source"
        fileLabel="Alpha file"
        filePath="src/alpha.ts"
        latestExecution={null}
        onToggleVersion={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Running..." })).toBeDisabled();
    expect(screen.queryByText("View latest execution")).not.toBeInTheDocument();
  });

  it("navigates to the execution details page after a successful run", async () => {
    mockedExecute.mockResolvedValueOnce({
      success: true,
      executionId: "exec-123",
    });

    const user = userEvent.setup();

    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0", "15.1.0"])}
        pipeline={pipeline}
        sourceLabel="Local Source"
        fileLabel="Alpha file"
        filePath="src/alpha.ts"
        latestExecution={null}
        onToggleVersion={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Execute" }));

    await waitFor(() => {
      expect(mockedExecute).toHaveBeenCalledWith("local", "alpha", "main-pipeline", ["16.0.0", "15.1.0"]);
      expect(mockedNavigate).toHaveBeenCalledWith({
        to: "/s/$sourceId/$sourceFileId/$pipelineId/executions/$executionId",
        params: {
          sourceId: "local",
          sourceFileId: "alpha",
          pipelineId: "main-pipeline",
          executionId: "exec-123",
        },
      });
    });
  });

  it("renders source, file, and latest execution links", () => {
    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0"])}
        pipeline={pipeline}
        sourceLabel="Local Source"
        fileLabel="Alpha file"
        filePath="src/alpha.ts"
        latestExecution={{
          id: "exec-existing",
          sourceId: "local",
          fileId: "alpha",
          pipelineId: "main-pipeline",
          status: "completed",
          startedAt: "2026-03-20T10:00:00.000Z",
          completedAt: "2026-03-20T10:01:00.000Z",
          versions: ["16.0.0"],
          summary: null,
          hasGraph: false,
          error: null,
        }}
        onToggleVersion={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
      />,
    );

    expect(screen.getByRole("link", { name: "Local Source" })).toHaveAttribute("href", "/s/local");
    expect(screen.getByRole("link", { name: "Alpha file" })).toHaveAttribute("href", "/s/local/alpha");
    expect(screen.getByText("View latest execution")).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-existing",
    );
  });
});
