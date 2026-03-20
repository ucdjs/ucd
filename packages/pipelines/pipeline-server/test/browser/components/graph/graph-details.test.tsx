import type { ExecutionGraphNodeView } from "#shared/schemas/graph";
import { PipelineGraphDetails } from "#components/graph/graph-details";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mockedNavigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => mockedNavigate,
  };
});

const node: ExecutionGraphNodeView = {
  id: "route:compile",
  nodeType: "route",
  flowType: "route",
  label: "compile",
  detailFields: [
    {
      label: "Route ID",
      type: "text",
      value: "compile",
    },
    {
      label: "Source",
      type: "content",
      value: "src/alpha.ts",
    },
    {
      label: "Meta",
      type: "json",
      value: { cached: true },
    },
  ],
  actions: [
    {
      label: "Open route",
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params: {
        sourceId: "local",
        sourceFileId: "alpha",
        pipelineId: "main-pipeline",
      },
      search: {
        route: "compile",
      },
    },
  ],
};

describe("PipelineGraphDetails", () => {
  it("does not render when no node is selected", () => {
    render(<PipelineGraphDetails node={null} onClose={() => {}} />);

    expect(screen.queryByTestId("pipeline-graph-details")).not.toBeInTheDocument();
  });

  it("renders text, content, and JSON fields", () => {
    render(<PipelineGraphDetails node={node} onClose={() => {}} />);

    expect(screen.getByTestId("pipeline-graph-details")).toBeInTheDocument();
    expect(screen.getByText("Route ID")).toBeInTheDocument();
    expect(screen.getByText("compile")).toBeInTheDocument();
    expect(screen.getByText("src/alpha.ts")).toBeInTheDocument();
    expect(screen.getByText(/"cached": true/)).toBeInTheDocument();
  });

  it("navigates through node actions and closes via the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<PipelineGraphDetails node={node} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Open route" }));
    expect(mockedNavigate).toHaveBeenCalledWith({
      to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
      params: {
        sourceId: "local",
        sourceFileId: "alpha",
        pipelineId: "main-pipeline",
      },
      search: {
        route: "compile",
      },
    });

    await user.click(screen.getByRole("button", { name: "Close details" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
