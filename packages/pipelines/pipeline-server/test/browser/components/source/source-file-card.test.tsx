import { SourceFileCard } from "#components/source/source-file-card";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({ children, to, params, ...props }: any) => {
      let href = to ?? "#";
      if (params?.sourceId) {
        href = href.replace("$sourceId", params.sourceId);
      }
      if (params?.sourceFileId) {
        href = href.replace("$sourceFileId", params.sourceFileId);
      }
      if (params?.pipelineId) {
        href = href.replace("$pipelineId", params.pipelineId);
      }

      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  };
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourceFileCard", () => {
  it("shows a fallback message when the source file has no pipelines", () => {
    render(
      <SourceFileCard
        sourceId="local"
        file={{
          id: "alpha",
          label: "Alpha file",
          path: "src/alpha.ts",
          pipelines: [],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /Alpha file/i })).toHaveAttribute("href", "/s/local/alpha");
    expect(screen.getByText("No pipelines found in this file.")).toBeInTheDocument();
  });

  it("renders pipeline metrics when the file contains pipelines", () => {
    render(
      <SourceFileCard
        sourceId="local"
        file={{
          id: "alpha",
          label: "Alpha file",
          path: "src/alpha.ts",
          pipelines: [
            {
              id: "main-pipeline",
              name: "Main pipeline",
              description: "Build and publish",
              versions: ["16.0.0", "15.1.0"],
              routeCount: 8,
              sourceCount: 3,
              sourceId: "local",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /Main pipeline/i })).toHaveAttribute("href", "/s/local/alpha/main-pipeline");
    expect(screen.getByText("Build and publish")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
