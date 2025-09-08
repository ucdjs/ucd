import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it, vi } from "vitest";
import { errorHandler, notFoundHandler } from "../../src/lib/handlers";

describe("error handler", () => {
  const errorApp = new Hono()
    .onError(errorHandler)
    .get("/error/1", () => {
      throw new Error("Test error");
    })
    .get("/error/2", () => {
      throw new HTTPException(400, {
        message: "HTTP Exception Error",
      });
    });

  it("should return 500 for generic errors", async () => {
    const res = await errorApp.request("/error/1");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      message: "Internal Server Error",
      status: 500,
      timestamp: expect.any(String),
    });
  });

  it("should return custom error for HTTPException", async () => {
    const res = await errorApp.request("/error/2");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      message: "HTTP Exception Error",
      status: 400,
      timestamp: expect.any(String),
    });
  });

  it("should log errors to console", async () => {
    using consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await errorApp.request("/error/1");
    expect(consoleSpy).toHaveBeenCalledWith("[api]: Error processing request:", "/error/1");
    expect(consoleSpy).toHaveBeenCalledWith("[api]: Error details:", expect.any(Error));
  });
});

describe("not found handler", () => {
  const notFoundApp = new Hono()
    .notFound(notFoundHandler)
    .get("/exists", (c) => c.text("Found"));

  it("should return 404 for non-existing routes", async () => {
    const res = await notFoundApp.request("/non-existing-route");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("should log not found to console", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await notFoundApp.request("/non-existing-route");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[api]: Not Found:", "/non-existing-route");
    consoleErrorSpy.mockRestore();
  });
});
