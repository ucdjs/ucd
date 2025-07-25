import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import {
  createExecutionContext,
  env,
  fetchMock,
  waitOnExecutionContext,
} from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import Worker from "../src/worker";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("error handling", () => {
  it("respond with a 404", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({
        path: "/Public/not-found?F=2",
      })
      .reply(404, "Not Found");

    const request = new Request("https://unicode-proxy.ucdjs.dev/not-found");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: "Not Found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("respond with a 500 on fetch error", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({
        path: "/Public/not-found?F=2",
      })
      .reply(500, "Internal Server Error");

    const request = new Request("https://unicode-proxy.ucdjs.dev/not-found");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Failed to fetch Unicode entry at path: not-found",
      status: 500,
      timestamp: expect.any(String),
    });
  });
});

describe("/.ucd-store.json route", () => {
  it("should return the Unicode directory store", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public?F=2" })
      .reply(200, generateAutoIndexHtml([
        { name: "16.0.0", path: "/16.0.0", type: "directory", lastModified: Date.now() },
        { name: "15.0.0", path: "/15.0.0", type: "directory", lastModified: Date.now() },
        { name: "14.0.0", path: "/14.0.0", type: "directory", lastModified: Date.now() },
      ], "F2"), {
        headers: {
          "Content-Type": "text/html",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/.ucd-store.json");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = await response.json() as Array<{ version: string; path: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    expect(data).toEqual([
      { version: "16.0.0", path: "/16.0.0" },
      { version: "15.0.0", path: "/15.0.0" },
      { version: "14.0.0", path: "/14.0.0" },
    ]);
  });

  it("should return an empty array if no entries found", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public?F=2" })
      .reply(200, generateAutoIndexHtml([], "F2"), {
        headers: {
          "Content-Type": "text/html",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/.ucd-store.json");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = await response.json() as Array<{ version: string; path: string }>;
    expect(data).toEqual([]);
  });

  it("should throw an error if entry is a file", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public?F=2" })
      .reply(200, generateAutoIndexHtml([], "F2"));

    const request = new Request("https://unicode-proxy.ucdjs.dev/.ucd-store.json");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Expected a directory for the root entry",
      status: 500,
      timestamp: expect.any(String),
    });
  });
});

describe("/__stat/:path route", () => {
  it("should return file metadata for a specific file", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/emoji/16.0/emoji-test.txt?F=2" })
      .reply(200, "emoji content", {
        headers: {
          "Last-Modified": new Date().toISOString(),
          "Content-Length": "1234",
          "Content-Type": "text/plain",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/__stat/emoji/16.0/emoji-test.txt");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = await response.json() as {
      type: string;
      mtime: string;
      size: number;
    };
    expect(data).toEqual({
      type: "file",
      mtime: expect.any(String),
      size: 1234,
    });
  });

  it("should return directory metadata for a specific directory", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/emoji/16.0?F=2" })
      .reply(200, generateAutoIndexHtml([
        { name: "emoji-test.txt", path: "/emoji/16.0/emoji-test.txt", type: "file", lastModified: Date.now() },
      ], "F2"), {
        headers: {
          "Last-Modified": new Date().toISOString(),
          "Content-Type": "text/html",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/__stat/emoji/16.0");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = await response.json() as {
      type: string;
      mtime: string;
      size?: number;
    };
    expect(data).toEqual({
      type: "directory",
      mtime: expect.any(String),
    });
  });
});

describe("/:path route", () => {
  it("should return directory listing for root path", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public?F=2" })
      .reply(200, generateAutoIndexHtml([
        { name: "emoji", path: "/emoji", type: "directory", lastModified: Date.now() },
        { name: "scripts", path: "/scripts", type: "directory", lastModified: Date.now() },
      ], "F2"), {
        headers: {
          "Content-Type": "text/html",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    const data = await response.json() as Array<{
      type: string;
      name: string;
      path: string;
    }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toMatchObject({
      type: expect.any(String),
      name: expect.any(String),
      path: expect.any(String),
    });
  });

  it("should return directory listing for nested directory", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/emoji?F=2" })
      .reply(200, generateAutoIndexHtml([
        { name: "16.0", path: "/emoji/16.0", type: "directory", lastModified: Date.now() },
        { name: "15.0", path: "/emoji/15.0", type: "directory", lastModified: Date.now() },
      ], "F2"), {
        headers: {
          "Content-Type": "text/html",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/emoji");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const data = await response.json() as Array<{
      type: string;
      name: string;
      path: string;
    }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toMatchObject({
      type: expect.any(String),
      name: expect.any(String),
      path: expect.any(String),
    });
  });

  it("should return file contents for specific file", async () => {
    fetchMock.get("https://unicode.org")
      .intercept({ path: "/Public/emoji/16.0/emoji-test.txt?F=2" })
      .reply(200, "emoji content", {
        headers: {
          "Last-Modified": new Date().toISOString(),
          "Content-Type": "text/plain",
          "Content-Length": "1234",
        },
      });

    const request = new Request("https://unicode-proxy.ucdjs.dev/emoji/16.0/emoji-test.txt");
    const ctx = createExecutionContext();
    const response = await new Worker(ctx, env as CloudflareBindings).fetch(request);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    const text = await response.text();
    expect(text).toMatch(/emoji/i);
  });
});
