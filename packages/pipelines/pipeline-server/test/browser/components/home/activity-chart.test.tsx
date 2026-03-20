import { ExecutionActivityChart } from "#components/home/activity-chart";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line test/prefer-lowercase-title
describe("ExecutionActivityChart", () => {
  it("updates the visible execution total when a state is toggled off", async () => {
    const user = userEvent.setup();

    render(
      <ExecutionActivityChart
        activity={[{
          date: "2026-03-08",
          pending: 0,
          running: 1,
          completed: 1,
          failed: 0,
          cancelled: 0,
        }]}
        summaryStates={{
          total: 2,
          pending: 0,
          running: 1,
          completed: 1,
          failed: 0,
          cancelled: 0,
        }}
      />,
    );

    expect(screen.getByRole("img", { name: /2 visible executions/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Running executions" }));

    const runningToggle = screen.getByRole("button", { name: "Show Running executions" });
    expect(runningToggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img", { name: /1 visible executions/i })).toBeInTheDocument();
  });

  it("renders the empty state when there is no activity", () => {
    render(
      <ExecutionActivityChart
        activity={[{
          date: "2026-03-08",
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        }]}
        summaryStates={{
          total: 0,
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        }}
      />,
    );

    expect(screen.getByText("No execution activity yet")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
