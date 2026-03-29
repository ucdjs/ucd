import { StatusOverview } from "#components/overview/status-overview";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line test/prefer-lowercase-title
describe("StatusOverview", () => {
  it("renders the total count and non-zero states alongside always-shown states", () => {
    render(
      <StatusOverview
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

    // The "Total" label and its count are always shown
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    // Running (2) is shown because count > 0
    expect(screen.getByText("2")).toBeInTheDocument();

    // Completed and failed are always shown (even when 0); pending and cancelled
    // are zero and not in the always-show list, so they are omitted.
    // Three state items render: completed(0), failed(0), running(2).
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2);
  });
});
