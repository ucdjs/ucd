import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import z from "zod";
import { strictJSONResponse } from "../src/strict";

describe("strictJSONResponse", () => {
  it("should return valid JSON response with correct status code", async () => {
    const app = new Hono();
    const schema = z.object({ message: z.string() });
    const data = { message: "Hello, world!" };
    const statusCode = 200;

    app.get("/", (c) => strictJSONResponse(c, schema, data, statusCode));

    const response = await app.request(new Request("http://localhost/"));
    expect(response.status).toBe(statusCode);
    expect(await response.json()).toEqual(data);
  });

  it("should throw error for invalid response data", async () => {
    const app = new Hono();
    const schema = z.object({ message: z.string() });
    const data = { message: 123 }; // Invalid type

    app.get("/", (c) => strictJSONResponse(c, schema, data as any));

    const response = await app.request(new Request("http://localhost/"));
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("message");
  });

  it("should handle optional status code", async () => {
    const app = new Hono();
    const schema = z.object({ success: z.boolean() });
    const data = { success: true };

    app.get("/", (c) => strictJSONResponse(c, schema, data));

    const response = await app.request(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
  });

  it("should return custom error message for invalid data", async () => {
    const app = new Hono();
    const schema = z.object({ id: z.number() });
    const data = { id: "not-a-number" }; // Invalid type

    app.get("/", (c) => strictJSONResponse(c, schema, data as any));

    const response = await app.request(new Request("http://localhost/"));
    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData).toHaveProperty("message");
    expect(errorData.message).toContain("Invalid response data");
  });
});
