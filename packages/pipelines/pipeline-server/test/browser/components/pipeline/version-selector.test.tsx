import { VersionSelector } from "#components/pipeline/version-selector";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

// eslint-disable-next-line test/prefer-lowercase-title
describe("VersionSelector", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("renders the selected version count and toggles individual versions", async () => {
    const user = userEvent.setup();

    render(
      <VersionSelector
        storageKey="test-vs"
        versions={["16.0.0", "15.1.0", "14.0.0"]}
      />,
    );

    expect(screen.getByRole("button", { name: /Versions/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Versions/i }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "15.1.0" }));

    // After toggling 15.1.0, it should be deselected (was selected by default)
    const stored = JSON.parse(localStorage.getItem("ucd-versions-test-vs")!);
    expect(stored).toEqual(["16.0.0", "14.0.0"]);
  });

  it("renders select-all and clear-selection actions", async () => {
    const user = userEvent.setup();

    render(
      <VersionSelector
        storageKey="test-vs-2"
        versions={["16.0.0"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Versions/i }));

    expect(await screen.findByRole("menuitem", { name: "Select all" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Clear selection" })).toBeInTheDocument();
  });

  it("renders repeated versions once per input item", async () => {
    const user = userEvent.setup();

    render(
      <VersionSelector
        storageKey="test-vs-3"
        versions={["16.0.0", "16.0.0", "15.1.0"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Versions/i }));

    expect(await screen.findAllByRole("menuitemcheckbox", { name: "16.0.0" })).toHaveLength(2);
    expect(await screen.findByRole("menuitemcheckbox", { name: "15.1.0" })).toBeInTheDocument();
  });
});
