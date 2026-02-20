import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCD_STAT_SIZE_HEADER, UCD_STAT_TYPE_HEADER } from "@ucdjs/env";
import { generateAutoIndexHtml } from "apache-autoindex-parse/test-utils";
import { describe, expect, it } from "vitest";
import { getRawUnicodeAsset, getUnicodeAsset, parseUnicodeDirectory } from "../../src/lib/files";

describe("parseUnicodeDirectory", () => {
  it("should parse HTML directory listing", async () => {
    const mockHtml = generateAutoIndexHtml([
      { type: "directory", name: "15.1.0", path: "/15.1.0/", lastModified: Date.now() },
      { type: "file", name: "UnicodeData.txt", path: "/UnicodeData.txt", lastModified: Date.now() },
    ], "F2");

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: "directory",
      name: "15.1.0",
      path: "/15.1.0/",
      lastModified: expect.any(Number),
    });
    expect(result[1]).toEqual({
      type: "file",
      name: "UnicodeData.txt",
      path: "/UnicodeData.txt",
      lastModified: expect.any(Number),
    });
  });

  it("should trim trailing slashes from names", async () => {
    const mockHtml = generateAutoIndexHtml([
      { type: "directory", name: "folder/", path: "/folder/", lastModified: Date.now() },
    ], "F2");

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result[0]!.name).toBe("folder");
    expect(result[0]!.path).toBe("/folder/");
  });

  it("should trim leading slashes from names", async () => {
    const mockHtml = generateAutoIndexHtml([
      { type: "directory", name: "/folder", path: "/folder/", lastModified: Date.now() },
    ], "F2");

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result[0]!.name).toBe("folder");
    expect(result[0]!.path).toBe("/folder/");
  });

  it("should return empty array when parsing fails", async () => {
    const invalidHtml = "<html><body>Invalid content</body></html>";

    const result = await parseUnicodeDirectory(invalidHtml);
    expect(result).toEqual([]);
  });
});

describe("getUnicodeAsset", () => {
  it("returns a 400 error object for invalid path", async () => {
    const result = await getUnicodeAsset("..%2Ftest", {});

    expect(result.status).toBe(400);
    expect(result.kind).toBe("error");
    expect(result.body).toBeTypeOf("string");

    const payload = JSON.parse(result.body as string) as { message: string; status: number };
    expect(payload.status).toBe(400);
    expect(payload.message).toBe("Invalid path");
  });

  it("returns upstream 404 response as error object", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/nonexistent/path", () => {
        return HttpResponse.text("Not Found", { status: 404 });
      }],
    ]);

    const result = await getUnicodeAsset("nonexistent/path", {});

    expect(result.status).toBe(404);
    expect(result.kind).toBe("error");

    const payload = JSON.parse(result.body as string) as { message: string; status: number };
    expect(payload.status).toBe(404);
    expect(payload.message).toBe("Remote fetch failed");
  });

  it("returns upstream failures as error object", async () => {
    mockFetch([
      ["GET", "https://unicode.org/Public/error/path", () => {
        return HttpResponse.text("Internal Server Error", { status: 500 });
      }],
    ]);

    const result = await getUnicodeAsset("error/path", {});

    expect(result.status).toBe(502);
    expect(result.kind).toBe("error");

    const payload = JSON.parse(result.body as string) as { message: string; status: number };
    expect(payload.status).toBe(502);
    expect(payload.message).toBe("Bad Gateway");
  });

  it("returns directory JSON and strips /ucd/ from entry paths when enabled", async () => {
    const html = generateAutoIndexHtml([
      { name: "Blocks.txt", path: "17.0.0/ucd/Blocks.txt", type: "file", lastModified: Date.now() },
      { name: "emoji", path: "17.0.0/ucd/emoji/", type: "directory", lastModified: Date.now() },
    ], "F2");

    mockFetch([
      ["GET", "https://unicode.org/Public/17.0.0/ucd", () => {
        return HttpResponse.text(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      }],
    ]);

    const result = await getUnicodeAsset("17.0.0/ucd", { stripUCDPrefix: true });

    expect(result.status).toBe(200);
    expect(result.kind).toBe("directory");
    expect(result.headers[UCD_STAT_TYPE_HEADER]).toBe("directory");
    expect(result.body).toBeTypeOf("string");

    const files = JSON.parse(result.body as string) as Array<{ path: string }>;
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((file) => !file.path.includes("/ucd/"))).toBe(true);
  });

  it("returns HEAD file metadata with null body", async () => {
    const content = "Head response content";

    mockFetch([
      ["GET", "https://unicode.org/Public/sample/file.txt", () => {
        return HttpResponse.text(content, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "content-length": content.length.toString(),
          },
        });
      }],
    ]);

    const result = await getUnicodeAsset("sample/file.txt", { isHeadRequest: true });

    expect(result.status).toBe(200);
    expect(result.kind).toBe("file");
    expect(result.body).toBeNull();
    expect(result.headers[UCD_STAT_TYPE_HEADER]).toBe("file");
    expect(result.headers[UCD_STAT_SIZE_HEADER]).toBe(content.length.toString());
    expect(result.headers["Content-Length"]).toBe(content.length.toString());
  });
});

describe("getRawUnicodeAsset", () => {
  it("fetches a unicode.org file without autoindex", async () => {
    const content = "ReadMe content";

    mockFetch([
      ["GET", "https://unicode.org/Public/draft/ReadMe.txt", () => {
        return HttpResponse.text(content, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
          },
        });
      }],
    ]);

    const result = await getRawUnicodeAsset("draft/ReadMe.txt");

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.url).toBe("https://unicode.org/Public/draft/ReadMe.txt?F=2");
    const text = await result.response.text();
    expect(text).toBe(content);
  });
});
