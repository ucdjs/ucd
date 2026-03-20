import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SourceIssuesDialog } from "../../src/client/components/source/source-issues-dialog";

const issues = [
  {
    code: "missing-meta",
    scope: "pipeline",
    message: "Alpha missing metadata",
    relativePath: "src/alpha.ts",
  },
  {
    code: "duplicate-id",
    scope: "pipeline",
    message: "Alpha has duplicate id",
    relativePath: "src/alpha.ts",
  },
  {
    code: "invalid-schema",
    scope: "source",
    message: "Beta schema is invalid",
    relativePath: "src/beta.ts",
  },
] satisfies ComponentProps<typeof SourceIssuesDialog>["issues"];

describe("SourceIssuesDialog", () => {
  it("opens, filters, and resets state when reopened", async () => {
    const user = userEvent.setup();

    render(
      <SourceIssuesDialog
        issues={issues}
        title="Source issues"
        description="Inspect source loading issues."
      />,
    );

    await user.click(screen.getByRole("button", { name: "View details" }));

    const dialog = await screen.findByTestId("source-issues-dialog");
    const withinDialog = within(dialog);

    expect(withinDialog.getByText("Source issues")).toBeInTheDocument();
    expect(withinDialog.getByText("Alpha missing metadata")).toBeInTheDocument();
    expect(withinDialog.getByText("Alpha has duplicate id")).toBeInTheDocument();
    expect(withinDialog.getByText("Beta schema is invalid")).toBeInTheDocument();

    await user.click(withinDialog.getByRole("button", { name: /src\/alpha\.ts/i }));
    expect(withinDialog.queryByText("Alpha missing metadata")).not.toBeInTheDocument();

    const filterInput = withinDialog.getByRole("textbox", { name: "Filter issues" });
    await user.type(filterInput, "beta");

    expect(filterInput).toHaveValue("beta");
    expect(withinDialog.queryByText("src/alpha.ts")).not.toBeInTheDocument();
    expect(withinDialog.getByText("src/beta.ts")).toBeInTheDocument();
    expect(withinDialog.getByText("Beta schema is invalid")).toBeInTheDocument();

    await user.click(withinDialog.getAllByRole("button", { name: "Close" })[0]!);
    expect(screen.queryByTestId("source-issues-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View details" }));

    const reopenedDialog = await screen.findByTestId("source-issues-dialog");
    const reopened = within(reopenedDialog);
    const reopenedFilter = reopened.getByRole("textbox", { name: "Filter issues" });

    expect(reopenedFilter).toHaveValue("");
    expect(reopened.getByText("Alpha missing metadata")).toBeInTheDocument();
    expect(reopened.getByText("Alpha has duplicate id")).toBeInTheDocument();
    expect(reopened.getByText("Beta schema is invalid")).toBeInTheDocument();
  });
});
