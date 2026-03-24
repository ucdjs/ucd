import type { PipelineHeaderProps } from "#components/pipeline/pipeline-header";
import type { ReactNode } from "react";
import { PipelineHeader } from "#components/pipeline/pipeline-header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({
      children,
      to,
      params,
      render: renderProp,
      ...props
    }: {
      children?: ReactNode;
      to: string;
      params: Record<string, string>;
      render?: ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const href = to
        .replace("$sourceId", params.sourceId ?? "")
        .replace("$sourceFileId", params.sourceFileId ?? "")
        .replace("$pipelineId", params.pipelineId ?? "");

      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
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
  it("renders the pipeline name in the breadcrumb and heading", () => {
    render(
      <PipelineHeader
        pipeline={pipeline}
        sourceLabel="Local Source"
        filePath="src/alpha.ts"
      />,
    );

    expect(screen.getByRole("link", { name: "Local Source" })).toHaveAttribute("href", "/s/local");
    expect(screen.getByText("Main pipeline")).toBeInTheDocument();
    expect(screen.getByText("Build and publish")).toBeInTheDocument();
    expect(screen.getByText("src/alpha.ts")).toBeInTheDocument();
  });

  it("falls back to id when pipeline has no name", () => {
    render(
      <PipelineHeader
        pipeline={{ ...pipeline, name: "" }}
        sourceLabel="Local Source"
        filePath="src/alpha.ts"
      />,
    );

    expect(screen.getAllByText("main-pipeline")).not.toHaveLength(0);
  });
});
