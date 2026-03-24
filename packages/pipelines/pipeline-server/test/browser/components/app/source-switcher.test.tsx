import { SourceSwitcher } from "#components/app/source-switcher";
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

const mockedNavigate = vi.hoisted(() => vi.fn());
const currentParams = vi.hoisted(() => ({} as Record<string, unknown>));

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
    useNavigate: () => mockedNavigate,
    useParams: () => currentParams,
  };
});

function renderSourceSwitcher() {
  return render(
    <SidebarProvider>
      <SourceSwitcher />
    </SidebarProvider>,
  );
}

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
describe("SourceSwitcher", () => {
  beforeEach(() => {
    mockMatchMedia();
    mockedNavigate.mockReset();
    currentParams.sourceId = undefined;
  });

  it("shows the current source label when a source is selected", async () => {
    currentParams.sourceId = "github";

    renderSourceSwitcher();

    expect(screen.getByTestId("source-switcher-trigger")).toHaveTextContent("GitHub Source");
    expect(screen.getByText("1 file")).toBeInTheDocument();
  });

  it("lists sources in the dropdown and navigates on selection", async () => {
    const user = userEvent.setup();
    renderSourceSwitcher();

    expect(screen.getByTestId("source-switcher-trigger")).toHaveTextContent("Local Source");

    await user.click(screen.getByTestId("source-switcher-trigger"));

    expect(await screen.findByTestId("source-switcher-option:local")).toHaveTextContent("Local Source");
    expect(screen.getByTestId("source-switcher-option:github")).toHaveTextContent("GitHub Source");

    await user.click(screen.getByTestId("source-switcher-option:github"));

    expect(mockedNavigate).toHaveBeenCalledWith({
      to: "/s/$sourceId",
      params: { sourceId: "github" },
    });
  });
});
