import type { ExecutionSpan } from "#lib/execution-utils";
import { ExecutionWaterfall } from "#components/execution/waterfall";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const spans: ExecutionSpan[] = [
  {
    spanId: "span-version",
    label: "version:start v16.0.0",
    phase: "Version",
    start: 200,
    end: 260,
    durationMs: 60,
  },
  {
    spanId: "span-parse",
    label: "parse:start v16.0.0",
    phase: "Parse",
    start: 100,
    end: 140,
    durationMs: 40,
  },
  {
    spanId: "span-error",
    label: "error build failed",
    phase: "Error",
    start: 320,
    end: 321,
    durationMs: 0,
    isError: true,
  },
];

describe("ExecutionWaterfall", () => {
  it("renders an empty state when there are no spans", () => {
    render(
      <ExecutionWaterfall
        spans={[]}
        selectedSpanId={null}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("No spans recorded for this execution.")).toBeInTheDocument();
  });

  it("renders spans in sorted order by start time", () => {
    render(
      <ExecutionWaterfall
        spans={spans}
        selectedSpanId={null}
        onSelect={() => {}}
      />,
    );

    const parse = screen.getByText("parse:start v16.0.0");
    const version = screen.getByText("version:start v16.0.0");
    const error = screen.getByText("error build failed");

    expect(parse.compareDocumentPosition(version) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(version.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("filters spans by phase", async () => {
    const user = userEvent.setup();

    render(
      <ExecutionWaterfall
        spans={spans}
        selectedSpanId={null}
        onSelect={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Parse1/i }));
    expect(screen.queryByText("parse:start v16.0.0")).not.toBeInTheDocument();
    expect(screen.getByText("version:start v16.0.0")).toBeInTheDocument();
  });

  it("preserves at least one active phase", async () => {
    const user = userEvent.setup();

    render(
      <ExecutionWaterfall
        spans={[spans[0]!]}
        selectedSpanId={null}
        onSelect={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Version1/i }));
    expect(screen.getByText("version:start v16.0.0")).toBeInTheDocument();
  });

  it("clears the selected log filter when requested", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ExecutionWaterfall
        spans={spans}
        selectedSpanId="span-parse"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("button", { name: "Clear log filter" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear log filter" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
