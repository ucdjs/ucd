import { Input } from "#ui/input";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("input", () => {
  it("renders an input element", () => {
    render(<Input aria-label="search" />);

    const input = screen.getByRole("textbox", { name: "search" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("accepts and displays a typed value", async () => {
    const user = userEvent.setup();

    render(<Input aria-label="username" />);

    const input = screen.getByRole("textbox", { name: "username" });
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("calls onChange when the value changes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input aria-label="field" onChange={handleChange} />);

    await user.type(screen.getByRole("textbox", { name: "field" }), "a");
    expect(handleChange).toHaveBeenCalled();
  });

  it("is disabled when the disabled prop is set", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input aria-label="disabled-field" disabled onChange={handleChange} />);

    const input = screen.getByRole("textbox", { name: "disabled-field" });
    expect(input).toBeDisabled();

    await user.type(input, "abc");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("renders a password input when type is password", () => {
    render(<Input type="password" aria-label="password" />);

    const input = screen.getByLabelText("password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("applies placeholder text", () => {
    render(<Input placeholder="Enter text…" aria-label="field" />);

    expect(screen.getByPlaceholderText("Enter text…")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Input aria-label="field" className="my-input-class" />);

    expect(screen.getByRole("textbox", { name: "field" })).toHaveClass("my-input-class");
  });

  it("forwards additional HTML attributes", () => {
    render(<Input aria-label="field" data-testid="my-input" />);

    expect(screen.getByTestId("my-input")).toBeInTheDocument();
  });
});
