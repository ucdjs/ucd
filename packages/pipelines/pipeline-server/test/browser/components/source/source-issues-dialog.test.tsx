import type { ComponentProps } from "react";
import { SourceIssuesDialog } from "#components/source/source-issues-dialog";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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
    meta: {
      parser: "schema-loader",
    },
  },
] satisfies ComponentProps<typeof SourceIssuesDialog>["issues"];

// eslint-disable-next-line test/prefer-lowercase-title
describe("SourceIssuesDialog", () => {
  it("groups issues by file path and can collapse a single group", async () => {
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

    expect(withinDialog.getByText("src/alpha.ts")).toBeInTheDocument();
    expect(withinDialog.getByText("2 issues")).toBeInTheDocument();
    expect(withinDialog.getByText("src/beta.ts")).toBeInTheDocument();
    expect(withinDialog.getByText("1 issue")).toBeInTheDocument();
    expect(withinDialog.getByText("Alpha missing metadata")).toBeInTheDocument();
    expect(withinDialog.getByText("Alpha has duplicate id")).toBeInTheDocument();
    expect(withinDialog.getByText("Beta schema is invalid")).toBeInTheDocument();

    await user.click(withinDialog.getByRole("button", { name: /src\/alpha\.ts/i }));

    expect(withinDialog.queryByText("Alpha missing metadata")).not.toBeInTheDocument();
    expect(withinDialog.queryByText("Alpha has duplicate id")).not.toBeInTheDocument();
    expect(withinDialog.getByText("Beta schema is invalid")).toBeInTheDocument();
  });

  it("matches filter text against issue metadata and shows an empty state when nothing matches", async () => {
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
    const filterInput = withinDialog.getByRole("textbox", { name: "Filter issues" });

    await user.type(filterInput, "schema-loader");

    expect(withinDialog.getByText("src/beta.ts")).toBeInTheDocument();
    expect(withinDialog.getByText("Beta schema is invalid")).toBeInTheDocument();
    expect(withinDialog.queryByText("src/alpha.ts")).not.toBeInTheDocument();

    await user.clear(filterInput);
    await user.type(filterInput, "does-not-exist");

    expect(withinDialog.getByText("No issues match the current filter.")).toBeInTheDocument();
    expect(withinDialog.getByText("0 / 3")).toBeInTheDocument();
  });

  it("resets filters and collapsed state when reopened", async () => {
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
    const filterInput = withinDialog.getByRole("textbox", { name: "Filter issues" });

    await user.click(withinDialog.getByRole("button", { name: /src\/alpha\.ts/i }));
    await user.type(filterInput, "beta");

    expect(filterInput).toHaveValue("beta");
    expect(withinDialog.queryByText("src/alpha.ts")).not.toBeInTheDocument();

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
    expect(reopened.getByText("src/alpha.ts")).toBeInTheDocument();
  });
});
