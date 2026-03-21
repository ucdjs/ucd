import { VersionSelector } from "#components/pipeline/version-selector";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("versionSelector", () => {
  it("renders the selected version count and toggles individual versions", async () => {
    const user = userEvent.setup();
    const onToggleVersion = vi.fn();

    render(
      <VersionSelector
        versions={["16.0.0", "15.1.0", "14.0.0"]}
        selectedVersions={new Set(["16.0.0", "14.0.0"])}
        onToggleVersion={onToggleVersion}
      />,
    );

    expect(screen.getByRole("button", { name: /Versions/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Versions/i }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "15.1.0" }));

    expect(onToggleVersion).toHaveBeenCalledWith("15.1.0");
  });

  it("renders select-all and clear-selection actions only when handlers are provided", async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    const onDeselectAll = vi.fn();

    const { rerender } = render(
      <VersionSelector
        versions={["16.0.0"]}
        selectedVersions={new Set()}
        onToggleVersion={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Versions/i }));
    expect(screen.queryByRole("menuitem", { name: "Select all" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Clear selection" })).not.toBeInTheDocument();

    rerender(
      <VersionSelector
        versions={["16.0.0"]}
        selectedVersions={new Set()}
        onToggleVersion={() => {}}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Versions/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Select all" }));
    await user.click(screen.getByRole("button", { name: /Versions/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Clear selection" }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it("renders repeated versions once per input item", async () => {
    const user = userEvent.setup();

    render(
      <VersionSelector
        versions={["16.0.0", "16.0.0", "15.1.0"]}
        selectedVersions={new Set()}
        onToggleVersion={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Versions/i }));

    expect(await screen.findAllByRole("menuitemcheckbox", { name: "16.0.0" })).toHaveLength(2);
    expect(await screen.findByRole("menuitemcheckbox", { name: "15.1.0" })).toBeInTheDocument();
  });
});
