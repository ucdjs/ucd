import { SourcesPanel } from "#components/home/sources-panel";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({ children, to, params, ...props }: any) => {
      const href = params?.sourceId ? to.replace("$sourceId", params.sourceId) : to;
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  };
});

vi.mock("#components/source/source-issues-dialog", () => {
  return {
    SourceIssuesDialog: ({ title, issues }: { title: string; issues: unknown[] }) => (
      <div data-testid={`source-issues-dialog:${title}`}>
        {title}
        :
        {issues.length}
      </div>
    ),
  };
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourcesPanel", () => {
  it("shows the empty state when no sources are configured", () => {
    render(<SourcesPanel sources={[]} />);

    const healthyBlock = screen.getByText("Healthy").parentElement;
    const issuesBlock = screen.getByText("With issues").parentElement;

    expect(healthyBlock).toBeInstanceOf(HTMLElement);
    expect(issuesBlock).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("No sources configured")).toBeInTheDocument();
    expect(within(healthyBlock as HTMLElement).getByText("0")).toBeInTheDocument();
    expect(within(issuesBlock as HTMLElement).getByText("0")).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ issues$/)).not.toBeInTheDocument();
  });

  it("summarizes unhealthy sources and renders issue dialogs only for failing sources", () => {
    render(
      <SourcesPanel
        sources={[
          {
            id: "local",
            type: "local",
            label: "Local Source",
            fileCount: 2,
            pipelineCount: 4,
            errors: [],
          },
          {
            id: "github",
            type: "github",
            label: "GitHub Source",
            fileCount: 1,
            pipelineCount: 2,
            errors: [
              {
                code: "missing-token",
                scope: "source",
                message: "Missing access token",
                relativePath: "repo/config.ts",
              },
              {
                code: "invalid-branch",
                scope: "source",
                message: "Invalid branch",
                relativePath: "repo/config.ts",
              },
            ],
          },
        ]}
      />,
    );

    const healthyBlock = screen.getByText("Healthy").parentElement;
    const issuesBlock = screen.getByText("With issues").parentElement;

    expect(healthyBlock).toBeInstanceOf(HTMLElement);
    expect(issuesBlock).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("2 issues")).toBeInTheDocument();
    expect(within(healthyBlock as HTMLElement).getByText("1")).toBeInTheDocument();
    expect(within(issuesBlock as HTMLElement).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Local Source/i })).toHaveAttribute("href", "/s/local");
    expect(screen.getByRole("link", { name: /GitHub Source/i })).toHaveAttribute("href", "/s/github");
    expect(screen.getByTestId("source-issues-dialog:GitHub Source issues")).toHaveTextContent("GitHub Source issues:2");
    expect(screen.queryByTestId("source-issues-dialog:Local Source issues")).not.toBeInTheDocument();
  });
});
