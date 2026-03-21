import { Button } from "#ui/button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Submit</Button>);

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when the disabled prop is set", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards additional HTML attributes", () => {
    render(<Button aria-label="custom label">Action</Button>);

    expect(screen.getByRole("button", { name: "custom label" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="my-custom-class">Styled</Button>);

    expect(screen.getByRole("button", { name: "Styled" })).toHaveClass("my-custom-class");
  });

  it.each([
    ["default", "default"],
    ["outline", "outline"],
    ["secondary", "secondary"],
    ["ghost", "ghost"],
    ["destructive", "destructive"],
    ["link", "link"],
  ] as const)("renders variant %s without errors", (_label, variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
  });

  it.each([
    ["default", "default"],
    ["xs", "xs"],
    ["sm", "sm"],
    ["lg", "lg"],
  ] as const)("renders size %s without errors", (_label, size) => {
    render(<Button size={size}>{size}</Button>);
    expect(screen.getByRole("button", { name: size })).toBeInTheDocument();
  });
});
