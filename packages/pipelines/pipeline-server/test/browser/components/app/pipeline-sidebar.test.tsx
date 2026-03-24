import { PipelineSidebar } from "#components/app/pipeline-sidebar";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    mockMatchMedia();
    currentParams.sourceId = undefined;
    currentParams.sourceFileId = undefined;
    currentParams.pipelineId = undefined;
    sourceFileListSpy.mockClear();
  });

  it.todo("shows workspace metadata and expands source files on demand when browsing all sources", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <PipelineSidebar workspaceId="workspace-123" version="16.0.0" />
      </SidebarProvider>,
    );

    expect(screen.getByTestId("pipeline-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-sidebar-workspace")).toHaveTextContent("workspace-123");
    expect(screen.getByTestId("pipeline-sidebar-version")).toHaveTextContent("16.0.0");
    expect(screen.getByTestId("pipeline-sidebar-source-switcher")).toContainElement(screen.getByTestId("source-switcher"));
    expect(screen.getByTestId("pipeline-sidebar-source-link:local")).toHaveAttribute("href", "/s/local");
    expect(screen.getByTestId("pipeline-sidebar-source-link:github")).toHaveAttribute("href", "/s/github");
    expect(screen.queryByTestId("source-file-list:local")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("pipeline-sidebar-source-toggle:local"));

    expect(screen.getByTestId("source-file-list:local")).toHaveTextContent("local:none:none");
    expect(sourceFileListSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: "local",
        currentFileId: undefined,
        currentPipelineId: undefined,
      }),
    );
  });

  it.todo("renders the active source file list directly when a source route is selected", () => {
    currentParams.sourceId = "github";
    currentParams.sourceFileId = "pipelines";
    currentParams.pipelineId = "main-flow";

    render(
      <SidebarProvider>
        <PipelineSidebar workspaceId="workspace-123" version="16.0.0" />
      </SidebarProvider>,
    );

    expect(screen.getByTestId("pipeline-sidebar-current-source:github")).toBeInTheDocument();
    expect(screen.getByTestId("source-file-list:github")).toHaveTextContent("github:pipelines:main-flow");
    expect(screen.queryByTestId("pipeline-sidebar-source-link:local")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pipeline-sidebar-source-link:github")).not.toBeInTheDocument();
    expect(sourceFileListSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: "github",
        currentFileId: "pipelines",
        currentPipelineId: "main-flow",
      }),
    );
  });
});
