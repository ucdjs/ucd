/* eslint-disable react/component-hook-factories */
import { SourceFileList } from "#components/app/source-file-list";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@ucdjs-internal/shared-ui/ui/sidebar";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryState = vi.hoisted(() => ({
  isLoading: false,
  data: {
    files: [
      {
        id: "alpha",
        path: "nested/alpha.ts",
        label: "Alpha file",
        pipelines: [
          {
            id: "alpha-pipeline",
            name: "Alpha pipeline",
            description: "Main alpha pipeline",
            versions: ["16.0.0"],
            routeCount: 3,
            sourceCount: 1,
            sourceId: "local",
          },
        ],
      },
      {
        id: "beta",
        path: "beta.ts",
        label: "Beta file",
        pipelines: [],
      },
    ],
  } as {
    files: Array<{
      id: string;
      path: string;
      label: string;
      pipelines: Array<{
        id: string;
        name: string;
        description: string;
        versions: string[];
        routeCount: number;
        sourceCount: number;
        sourceId: string;
      }>;
    }>;
  } | undefined,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: () => ({
      data: queryState.data,
      isLoading: queryState.isLoading,
    }),
  };
});

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
describe("SourceFileList", () => {
  beforeEach(() => {
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

    queryState.isLoading = false;
    queryState.data = {
      files: [
        {
          id: "alpha",
          path: "nested/alpha.ts",
          label: "Alpha file",
          pipelines: [
            {
              id: "alpha-pipeline",
              name: "Alpha pipeline",
              description: "Main alpha pipeline",
              versions: ["16.0.0"],
              routeCount: 3,
              sourceCount: 1,
              sourceId: "local",
            },
          ],
        },
        {
          id: "beta",
          path: "beta.ts",
          label: "Beta file",
          pipelines: [],
        },
      ],
    };
  });

  it("shows a loading message while source files are still being fetched", () => {
    queryState.isLoading = true;

    render(
      <SidebarProvider>
        <SourceFileList
          sourceId="local"
          currentFileId={undefined}
          currentPipelineId={undefined}
          expanded={{}}
          toggle={vi.fn()}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it.todo("renders nested files and lets the user expand a file to reveal its pipelines", async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();

    render(
      <SidebarProvider>
        <SourceFileList
          sourceId="local"
          currentFileId={undefined}
          currentPipelineId={undefined}
          expanded={{ "local:alpha": false }}
          toggle={toggle}
        />
      </SidebarProvider>,
    );

    expect(screen.getByText("nested")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alpha\.ts/i })).toHaveAttribute("href", "/s/local/alpha");
    expect(screen.getByRole("link", { name: /beta\.ts/i })).toHaveAttribute("href", "/s/local/beta");
    expect(screen.queryByRole("link", { name: /Alpha pipeline/i })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button")[1]!);

    expect(toggle).toHaveBeenCalledWith("local:alpha", false);
  });
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderFileRoute } from "../../route-test-utils";

const sourceResponse = {
  id: "local",
  type: "local",
  label: "Local Source",
  errors: [],
  files: [
    {
      id: "alpha",
      path: "nested/alpha.ts",
      label: "Alpha file",
      pipelines: [
        {
          id: "alpha-pipeline",
          name: "Alpha pipeline",
          description: "Main alpha pipeline",
          versions: ["16.0.0"],
          routeCount: 3,
          sourceCount: 1,
          sourceId: "local",
        },
      ],
    },
    {
      id: "beta",
      path: "beta.ts",
      label: "Beta file",
      pipelines: [],
    },
  ],
};

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourceFileList", () => {
  beforeEach(() => {
    mockFetch([
      ["GET", "/api/config", () => HttpResponse.json({ workspaceId: "workspace-123", version: "16.0.0" })],
      ["GET", "/api/sources", () => HttpResponse.json([{ id: "local", type: "local", label: "Local Source", fileCount: 2, pipelineCount: 4, errors: [] }])],
      ["GET", "/api/sources/:sourceId", ({ params }) => HttpResponse.json(params.sourceId === "local" ? sourceResponse : { id: params.sourceId, type: "local", label: params.sourceId, errors: [], files: [] })],
      ["GET", "/api/sources/:sourceId/overview", () => HttpResponse.json({ activity: [], summary: { total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 }, recentExecutions: [] })],
    ]);
  });

  it("renders source files once data is loaded", async () => {
    await renderFileRoute(<div />, { initialLocation: "/s/local" });

    expect(await screen.findAllByText("alpha.ts")).not.toHaveLength(0);
    expect(screen.getAllByText("beta.ts")).not.toHaveLength(0);
  });

  it.todo("renders nested files and lets the user expand a file to reveal its pipelines");
});
