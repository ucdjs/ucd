import type { PipelineHeaderProps } from "#components/pipeline/pipeline-header";
import { PipelineHeader } from "#components/pipeline/pipeline-header";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderComponent } from "../../route-test-utils";

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
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "w", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([])],
    ]);
  });

  it("renders the pipeline name in the breadcrumb and heading", async () => {
    await renderComponent(
      <PipelineHeader
        pipeline={pipeline}
        sourceLabel="Local Source"
        filePath="src/alpha.ts"
      />,
      { initialLocation: "/s/local/alpha/main-pipeline" },
    );

    expect(screen.getByText("Local Source")).toBeInTheDocument();
    expect(screen.getAllByText("Main pipeline")).not.toHaveLength(0);
    expect(screen.getByText("Build and publish")).toBeInTheDocument();
    expect(screen.getByText("src/alpha.ts")).toBeInTheDocument();
  });

  it("falls back to id when pipeline has no name", async () => {
    await renderComponent(
      <PipelineHeader
        pipeline={{ ...pipeline, name: "" }}
        sourceLabel="Local Source"
        filePath="src/alpha.ts"
      />,
      { initialLocation: "/s/local/alpha/main-pipeline" },
    );

    expect(screen.getAllByText("main-pipeline")).not.toHaveLength(0);
  });
});
