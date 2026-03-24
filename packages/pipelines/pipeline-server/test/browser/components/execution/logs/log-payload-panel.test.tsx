import { LogPayloadPanel } from "#components/execution/logs/log-payload-panel";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("logPayloadPanel", () => {
  it("renders the raw message when a log has no payload", () => {
    render(
      <LogPayloadPanel
        log={{
          id: "log-1",
          timestamp: "2026-03-20T10:00:00.000Z",
          message: "Raw stderr output",
          stream: "stderr",
          payload: null,
          spanId: null,
        }}
      />,
    );

    expect(screen.getByText("Raw stderr output")).toBeInTheDocument();
  });

  it("renders payload details and formatted JSON when payload exists", () => {
    render(
      <LogPayloadPanel
        log={{
          id: "log-2",
          timestamp: "2026-03-20T10:00:00.000Z",
          message: "ignored",
          stream: "stdout",
          spanId: "span-1",
          payload: {
            level: "warn",
            stream: "stdout",
            source: "logger",
            message: "Structured log",
            args: ["Structured log"],
            meta: { routeId: "compile" },
            event: {
              id: "event-1",
              type: "file:matched",
              file: { version: "16.0.0", dir: "ucd", path: "ucd/data.txt", name: "data.txt", ext: ".txt" },
              routeId: "compile",
              spanId: "span-1",
              timestamp: 1,
            },
          },
        }}
      />,
    );

    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("logger")).toBeInTheDocument();
    expect(screen.getByText("artifact:produced")).toBeInTheDocument();
    expect(screen.getByText(/"routeId": "compile"/)).toBeInTheDocument();
  });
});
