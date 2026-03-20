import { VersionSelector } from "#components/pipeline/version-selector";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("VersionSelector", () => {
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

    expect(screen.getByText("Versions (2/3)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "15.1.0" }));

    expect(onToggleVersion).toHaveBeenCalledWith("15.1.0");
  });

  it("renders All and None only when handlers are provided", async () => {
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

    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "None" })).not.toBeInTheDocument();

    rerender(
      <VersionSelector
        versions={["16.0.0"]}
        selectedVersions={new Set()}
        onToggleVersion={() => {}}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />,
    );

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "None" }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it("renders repeated versions once per input item", () => {
    render(
      <VersionSelector
        versions={["16.0.0", "16.0.0", "15.1.0"]}
        selectedVersions={new Set()}
        onToggleVersion={() => {}}
      />,
    );

    expect(screen.getByText("Versions (0/3)")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "16.0.0" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "15.1.0" })).toBeInTheDocument();
  });
});
