import type { ReactNode } from "react";
import type { PipelineHeaderProps } from "#components/pipeline/pipeline-header";
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
      params,
      ...props
    }: {
      children: ReactNode;
      params: { sourceId: string; sourceFileId: string; pipelineId: string; executionId: string };
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={`/s/${params.sourceId}/${params.sourceFileId}/${params.pipelineId}/executions/${params.executionId}`}
        {...props}
      >
        {children}
      </a>
    ),
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

describe("PipelineHeader", () => {
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
        fileLabel="Alpha file"
      />,
    );

    expect(screen.getByRole("button", { name: "Execute" })).toBeDisabled();
  });

  it("shows the running state while an execution is in progress", () => {
    executeState.executing = true;

    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0"])}
        pipeline={pipeline}
        fileLabel="Alpha file"
      />,
    );

    expect(screen.getByRole("button", { name: "Running..." })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "View Execution" })).not.toBeInTheDocument();
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
        fileLabel="Alpha file"
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

  it("does not navigate when execution fails or returns no execution id", async () => {
    mockedExecute.mockResolvedValueOnce({
      success: false,
      executionId: null,
    });

    const user = userEvent.setup();

    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0"])}
        pipeline={pipeline}
        fileLabel="Alpha file"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Execute" }));

    await waitFor(() => {
      expect(mockedExecute).toHaveBeenCalledWith("local", "alpha", "main-pipeline", ["16.0.0"]);
    });

    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it("renders the View Execution link when a previous execution id exists", () => {
    executeState.executionId = "exec-existing";

    render(
      <PipelineHeader
        selectedVersions={new Set(["16.0.0"])}
        pipeline={pipeline}
        fileLabel="Alpha file"
      />,
    );

    expect(screen.getByRole("link", { name: "View Execution" })).toHaveAttribute(
      "href",
      "/s/local/alpha/main-pipeline/executions/exec-existing",
    );
  });
});
