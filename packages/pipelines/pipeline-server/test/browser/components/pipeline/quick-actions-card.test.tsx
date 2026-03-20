import { QuickActionsCard } from "#components/pipeline/quick-actions-card";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuickActionsRouter } from "../../router-test-utils";

const mockedExecute = vi.hoisted(() => vi.fn());
const mockedReset = vi.hoisted(() => vi.fn());
const executeState = vi.hoisted(() => ({
  executing: false,
  result: null as unknown,
  error: null as unknown,
  executionId: null as string | null,
}));

vi.mock("#hooks/use-execute", () => {
  return {
    useExecute: () => ({
      execute: mockedExecute,
      executing: executeState.executing,
      result: executeState.result,
      error: executeState.error,
      executionId: executeState.executionId,
      reset: mockedReset,
    }),
  };
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("QuickActionsCard", () => {
  beforeEach(() => {
    mockedExecute.mockReset();
    mockedReset.mockReset();
    executeState.executing = false;
    executeState.result = null;
    executeState.error = null;
    executeState.executionId = null;
  });

  it("renders router links for the current pipeline route", async () => {
    await renderWithQuickActionsRouter({
      component: () => <QuickActionsCard versions={["16.0.0"]} />,
    });

    expect(screen.getByRole("link", { name: /View executions/i })).toHaveAttribute(
      "href",
      "/s/local/simple/first-pipeline/executions",
    );
    expect(screen.getByRole("link", { name: /Browse graphs/i })).toHaveAttribute(
      "href",
      "/s/local/simple/first-pipeline/graphs",
    );
    expect(screen.getByRole("link", { name: /Inspect routes/i })).toHaveAttribute(
      "href",
      "/s/local/simple/first-pipeline/inspect",
    );
  });

  it("disables execution when no versions are selected", async () => {
    const user = userEvent.setup();

    await renderWithQuickActionsRouter({
      component: () => <QuickActionsCard versions={[]} />,
    });

    const executeButton = screen.getByRole("button", { name: /Execute pipeline/i });
    expect(executeButton).toBeDisabled();

    await user.click(executeButton);
    expect(mockedExecute).not.toHaveBeenCalled();
  });

  it("shows a running state while execution is in progress", async () => {
    executeState.executing = true;

    await renderWithQuickActionsRouter({
      component: () => <QuickActionsCard versions={["16.0.0"]} />,
    });

    expect(screen.getByRole("button", { name: /Running pipeline/i })).toBeDisabled();
  });

  it("navigates to the execution details route after a successful execute", async () => {
    mockedExecute.mockResolvedValueOnce({
      success: true,
      pipelineId: "first-pipeline",
      executionId: "exec-123",
    });

    const user = userEvent.setup();
    const { history } = await renderWithQuickActionsRouter({
      component: () => <QuickActionsCard versions={["16.0.0"]} />,
    });

    await user.click(screen.getByRole("button", { name: /Execute pipeline/i }));

    await waitFor(() => {
      expect(mockedExecute).toHaveBeenCalledWith("local", "simple", "first-pipeline", ["16.0.0"]);
      expect(history.location.pathname).toBe("/s/local/simple/first-pipeline/executions/exec-123");
    });
  });

  it("stays on the current route when execution does not return an execution id", async () => {
    mockedExecute.mockResolvedValueOnce({
      success: false,
      pipelineId: "first-pipeline",
      executionId: null,
    });

    const user = userEvent.setup();
    const { history } = await renderWithQuickActionsRouter({
      component: () => <QuickActionsCard versions={["16.0.0"]} />,
    });

    await user.click(screen.getByRole("button", { name: /Execute pipeline/i }));

    await waitFor(() => {
      expect(mockedExecute).toHaveBeenCalledWith("local", "simple", "first-pipeline", ["16.0.0"]);
    });

    expect(history.location.pathname).toBe("/s/local/simple/first-pipeline");
  });
});
