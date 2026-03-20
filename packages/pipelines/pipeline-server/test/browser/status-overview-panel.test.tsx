import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusOverviewPanel } from "../../src/client/components/home/status-overview-panel";

describe("StatusOverviewPanel", () => {
  it("renders totals and hides zero-value optional states", () => {
    render(
      <StatusOverviewPanel
        total={8}
        summaryStates={{
          total: 8,
          pending: 0,
          running: 2,
          completed: 0,
          failed: 0,
          cancelled: 0,
        }}
      />,
    );

    const heading = screen.getByText("Status overview");
    const card = heading.closest('[data-slot="card"]');

    expect(card).not.toBeNull();

    const panel = within(card!);
    expect(panel.getByText("Executions")).toBeInTheDocument();
    expect(panel.getByText("8")).toBeInTheDocument();
    expect(panel.getByText("Completed")).toBeInTheDocument();
    expect(panel.getByText("Failed")).toBeInTheDocument();
    expect(panel.getByText("Running")).toBeInTheDocument();
    expect(panel.getByText("2")).toBeInTheDocument();
    expect(panel.queryByText("Cancelled")).not.toBeInTheDocument();
  });
});
