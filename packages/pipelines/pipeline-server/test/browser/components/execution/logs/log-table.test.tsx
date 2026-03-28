import type { ComponentProps } from "react";
import { ExecutionLogTable } from "#components/execution/logs/log-table";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

const logs = [
  {
    id: "log-1",
    timestamp: "2026-03-20T10:00:00.000Z",
    message: "A stderr message",
    payload: null,
    spanId: null,
  },
  {
    id: "log-2",
    timestamp: "2026-03-20T10:00:10.000Z",
    message: "ignored fallback",
    spanId: "span-1",
    payload: {
      level: "info",
      source: "logger",
      message: "Handled payload",
      args: [
        "Handled payload",
        { nested: "abcdefghijklmnopqrstuvwxyz1234567890" },
      ],
      meta: { attempt: 1, worker: "alpha" },
      event: {
        id: "event-1",
        type: "file:matched",
        file: { version: "16.0.0", dir: "ucd", path: "ucd/data.txt", name: "data.txt", ext: ".txt" },
        routeId: "compile",
        spanId: "span-1",
        timestamp: 1,
      },
    },
  },
] satisfies ComponentProps<typeof ExecutionLogTable>["logs"];

// eslint-disable-next-line test/prefer-lowercase-title
describe("ExecutionLogTable", () => {
  it("renders the empty state when there are no logs", () => {
    render(<ExecutionLogTable logs={[]} />);

    expect(screen.getByText("No logs captured for this execution.")).toBeInTheDocument();
  });

  it.todo("expands and collapses a log row to show payload details", async () => {
    const user = userEvent.setup();

    render(<ExecutionLogTable logs={logs} />);

    const row = screen.getByText("Handled payload %O {\"attempt\":1,\"worker\":\"alpha\"}").closest("tr");
    expect(row).not.toBeNull();

    await user.click(row!);

    expect(screen.getByText("file:matched")).toBeInTheDocument();
    expect(screen.getByText("logger")).toBeInTheDocument();

    await user.click(row!);

    expect(screen.queryByText("file:matched")).not.toBeInTheDocument();
  });

  it("uses the stderr error row path and the %O placeholder for large objects", () => {
    render(<ExecutionLogTable logs={logs} />);

    const stderrRow = screen.getByText("A stderr message").closest("tr");
    expect(stderrRow).toHaveClass("cursor-pointer");

    const loggerRow = screen.getByText("Handled payload %O {\"attempt\":1,\"worker\":\"alpha\"}").closest("tr");
    expect(loggerRow).not.toBeNull();

    const rowCells = within(loggerRow!).getAllByRole("cell");
    expect(rowCells[2]).toHaveTextContent("Handled payload %O {\"attempt\":1,\"worker\":\"alpha\"}");
  });
});
