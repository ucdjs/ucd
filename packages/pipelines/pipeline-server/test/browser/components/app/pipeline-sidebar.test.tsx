/* eslint-disable react/component-hook-factories */
import { PipelineSidebar } from "#components/app/pipeline-sidebar";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderFileRoute } from "../../route-test-utils";

const sourceData = vi.hoisted(() => [
  {
    id: "local",
    type: "local" as const,
    label: "Local Source",
    fileCount: 2,
    pipelineCount: 4,
    errors: [],
  },
  {
    id: "github",
    type: "github" as const,
    label: "GitHub Source",
    fileCount: 1,
    pipelineCount: 2,
    errors: [],
  },
]);

const currentParams = vi.hoisted(() => ({} as Record<string, unknown>));
const sourceFileListSpy = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: () => ({
      data: sourceData,
    }),
  };
});

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({
      children,
      to,
      params,
      className,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      to?: string;
      params?: Record<string, string>;
      className?: string;
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    }) => (
      <a
        href={to && params?.sourceId ? to.replace("$sourceId", params.sourceId) : (to ?? "#")}
        className={className}
        onClick={onClick}
        {...props}
      >
        {children}
      </a>
    ),
    useParams: () => currentParams,
  };
});

vi.mock("#components/app/source-switcher", () => {
  return {
    SourceSwitcher: () => <div data-testid="source-switcher">source switcher</div>,
  };
});

vi.mock("#components/app/source-file-list", () => {
  return {
    SourceFileList: (props: {
      sourceId: string;
      currentFileId: string | undefined;
      currentPipelineId: string | undefined;
      expanded: Record<string, boolean>;
      toggle: (key: string, isOpen: boolean) => void;
    }) => {
      sourceFileListSpy(props);
      return (
        <div data-testid={`source-file-list:${props.sourceId}`}>
          {props.sourceId}
          :
          {props.currentFileId ?? "none"}
          :
          {props.currentPipelineId ?? "none"}
        </div>
      );
    },
  };
});

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// eslint-disable-next-line test/prefer-lowercase-title
describe("PipelineSidebar", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([
        { id: "local", type: "local", label: "Local Source", fileCount: 1, pipelineCount: 1, errors: [] },
      ])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json({
        id: params.sourceId,
        type: "local",
        label: "Local Source",
        errors: [],
        files: [
          {
            id: "alpha",
            path: "src/alpha.ts",
            label: "Alpha file",
            pipelines: [
              { id: "main-pipeline", name: "Main pipeline", description: "Build and publish", versions: ["16.0.0"], routeCount: 2, sourceCount: 1, sourceId: "local" },
            ],
          },
        ],
      })],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({
        activity: [],
        summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
        recentExecutions: [],
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId", () => HttpResponse.json({
        pipeline: {
          id: "main-pipeline",
          name: "Main pipeline",
          description: "Build and publish",
          include: undefined,
          versions: ["16.0.0"],
          routeCount: 2,
          sourceCount: 1,
          routes: [],
          sources: [{ id: "local" }],
        },
      })],
      ["GET", "/api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions", () => HttpResponse.json({
        executions: [],
        pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
      })],
    ]);
  });

  it("shows workspace metadata and the source switcher on source routes", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findByTestId("pipeline-sidebar-workspace")).toHaveTextContent("workspace-123");
    expect(screen.getByTestId("pipeline-sidebar-version")).toHaveTextContent("16.0.0");
    expect(screen.getByTestId("pipeline-sidebar-source-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("source-switcher-trigger")).toHaveTextContent("Local Source");
  });

  it("shows pipeline navigation and identity when on a pipeline route", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local/alpha/main-pipeline" });

    expect(await screen.findByTestId("pipeline-sidebar-nav")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-overview")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-inspect")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-nav-executions")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-identity")).toHaveTextContent("Main pipeline");
    expect(screen.getByTestId("pipeline-sidebar-back-link")).toBeInTheDocument();
  });
});
