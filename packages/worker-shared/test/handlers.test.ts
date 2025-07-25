import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it, vi } from "vitest";
import { errorHandler, notFoundHandler } from "../src/handlers";

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
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await errorApp.request("/error/1");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[worker-shared]: Error processing request:", "/error/1");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[worker-shared]: Error details:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});

describe("not found handler", () => {
  const notFoundApp = new Hono()
    .notFound(notFoundHandler)
    .get("/existing-route", (c) => c.text("This route exists"))
    .get("/another-route", (c) => c.text("Another route exists"));

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

  it("should return 404 for routes that exist but are not handled", async () => {
    const res = await notFoundApp.request("/existing-route/extra");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("should log not found errors to console", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await notFoundApp.request("/non-existing-route");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[worker-shared]: Not Found:", "/non-existing-route");
    consoleErrorSpy.mockRestore();
  });
});
