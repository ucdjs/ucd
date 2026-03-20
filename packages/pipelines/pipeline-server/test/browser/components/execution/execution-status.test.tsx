import { StatusBadge } from "#components/execution/execution-status";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line test/prefer-lowercase-title
describe("StatusBadge", () => {
  it("maps known statuses to the expected labels", () => {
    render(
      <>
        <StatusBadge status="completed" />
        <StatusBadge status="failed" />
        <StatusBadge status="running" />
        <StatusBadge status="cancelled" />
      </>,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toBeInTheDocument();
  });
});
