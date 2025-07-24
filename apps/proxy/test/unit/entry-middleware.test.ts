import { HttpResponse, mockFetch } from "#msw-utils";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { Hono } from "hono";
import { assert, describe, expect, it } from "vitest";
import { entryMiddleware } from "../../src/entry-middleware";

describe("entry middleware", () => {
  it("should call next middleware if entry is found", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public", () => {
        return HttpResponse.text(generateAutoIndexHtml([
          { type: "directory", name: "UNIDATA", path: "/UNIDATA" },
          { type: "file", name: "emoji-data.txt", path: "/emoji-data.txt" },
        ], "F2"));
      }],
    ]);

    let executed = false;
    const app = new Hono().get("/test", entryMiddleware, (c) => {
      executed = true;
      return c.text("Handler executed");
    });

    const response = await app.request("https://ucdjs.dev/test");
    await response.text();

    expect(executed).toBe(true);
  });

  it("entry should be available in context", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public", () => {
        return HttpResponse.text(
          generateAutoIndexHtml([
            { type: "directory", name: "UNIDATA", path: "/UNIDATA" },
            { type: "file", name: "emoji-data.txt", path: "/emoji-data.txt" },
          ], "F2"),
          {
            headers: { "Content-Type": "text/html" },
          },
        );
      }],
    ]);

    const app = new Hono().get("/test", entryMiddleware, (c) => {
      const entry = c.get("entry");
      expect(entry).toBeDefined();
      return c.json(entry);
    });

    const response = await app.request("https://ucdjs.dev/test");
    const data = await response.json();

    expect(data).toEqual({
      type: "directory",
      files: [
        { type: "directory", name: "UNIDATA", path: "/UNIDATA" },
        { type: "file", name: "emoji-data.txt", path: "/emoji-data.txt" },
      ],
      headers: expect.any(Object),
    });
  });

  it("should set entry to file", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/emoji-data.txt", () => {
        return HttpResponse.text("Emoji data content", {
          headers: {
            "Content-Type": "text/plain",
            "Content-Length": "17",
            "Last-Modified": new Date().toISOString(),
          },
        });
      }],
    ]);

    const app = new Hono().get("/test/:path", entryMiddleware, (c) => {
      const entry = c.get("entry");

      assert(entry, "Entry should be defined");
      expect(entry).toBeDefined();
      assert(entry.type === "file", "Entry type should be 'file'");
      expect(entry.type).toBe("file");

      return c.newResponse(entry.content, {
        headers: entry.headers,
      });
    });
    const response = await app.request("https://ucdjs.dev/test/emoji-data.txt");
    const data = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(data).toBe("Emoji data content");
  });

  it("should handle ProxyFetchError", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/not-valid-path", () => {
        return HttpResponse.text("Not Found", { status: 404 });
      }],
    ]);

    const app = new Hono().get("/test/:path{.*}?", entryMiddleware, (c) => {
      return c.text("This should not be reached");
    });

    const response = await app.request("https://ucdjs.dev/test/not-valid-path");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("should error if `getEntryByPath` fails", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public", () => {
        return HttpResponse.error();
      }],
    ]);

    const app = new Hono().get("/test", entryMiddleware, (c) => {
      return c.text("This should not be reached");
    });

    const response = await app.request("https://ucdjs.dev/test");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Internal Server Error",
      status: 500,
      timestamp: expect.any(String),
    });
  });

  describe("path validation", () => {
    it("should return 400 for invalid paths", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public", () => {}],
      ]);

      let executed = false;
      const app = new Hono()
        .get("/:path{.*}?", entryMiddleware, (c) => {
          executed = true;
          return c.text("Handler executed");
        });

      const response = await app.request("https://ucdjs.dev/%2E%2E%2Fetc%2Fpasswd");

      expect(response.status).toBe(400);
      expect(executed).toBe(false);
      expect(await response.json()).toEqual({
        message: "Invalid path",
        status: 400,
        timestamp: expect.any(String),
      });
    });
  });
});
