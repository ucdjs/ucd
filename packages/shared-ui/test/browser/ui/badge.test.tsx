import { Badge } from "#ui/badge";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders as a span by default", () => {
    render(<Badge>Label</Badge>);

    const badge = screen.getByText("Label");
    expect(badge.tagName).toBe("SPAN");
  });

  it("renders a custom element via render prop", () => {
    render(<Badge render={<a href="/link" />}>Link badge</Badge>);

    const link = screen.getByRole("link", { name: "Link badge" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/link");
  });

  it("applies custom className", () => {
    render(<Badge className="my-badge-class">Badge</Badge>);

    expect(screen.getByText("Badge")).toHaveClass("my-badge-class");
  });

  it.each([
    ["default", "default"],
    ["secondary", "secondary"],
    ["destructive", "destructive"],
    ["outline", "outline"],
    ["ghost", "ghost"],
    ["link", "link"],
  ] as const)("renders variant %s without errors", (_label, variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant)).toBeInTheDocument();
  });
});
