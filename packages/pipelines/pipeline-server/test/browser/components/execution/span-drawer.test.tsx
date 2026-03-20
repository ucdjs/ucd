import type { ExecutionSpan } from "#lib/execution-utils";
import type { ReactNode } from "react";
import { ExecutionSpanDrawer } from "#components/execution/span-drawer";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ucdjs-internal/shared-ui/ui/sheet", () => {
  return {
    Sheet: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange: (nextOpen: boolean) => void;
      children: ReactNode;
    }) => (open
      ? (
          <div data-testid="execution-span-sheet">
            <button type="button" onClick={() => onOpenChange(false)}>Close sheet</button>
            {children}
          </div>
        )
      : null),
    SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  };
});

const span: ExecutionSpan = {
  spanId: "span-1",
  label: "parse:start v16.0.0",
  phase: "Parse",
  start: 1_000,
  end: 1_050,
  durationMs: 50,
  isError: false,
};

describe("executionSpanDrawer", () => {
  it("stays closed when no span is selected", () => {
    render(
      <ExecutionSpanDrawer
        span={null}
        baseTime={1_000}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByTestId("execution-span-sheet")).not.toBeInTheDocument();
  });

  it("renders the selected span details and computed offsets", () => {
    render(
      <ExecutionSpanDrawer
        span={span}
        baseTime={900}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Span Details")).toBeInTheDocument();
    expect(screen.getByText("parse:start v16.0.0")).toBeInTheDocument();
    expect(screen.getByText("Parse")).toBeInTheDocument();
    expect(screen.getByText("50.0ms")).toBeInTheDocument();
    expect(screen.getByText("100.0ms")).toBeInTheDocument();
    expect(screen.getByText("150.0ms")).toBeInTheDocument();
  });

  it("calls onClose when the sheet closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ExecutionSpanDrawer
        span={span}
        baseTime={900}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close sheet" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
