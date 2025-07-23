import type { Entry } from "apache-autoindex-parse";
import { mockFetch } from "#msw-utils";
import { DEFAULT_USER_AGENT } from "@ucdjs/env";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getEntryByPath, parseUnicodeDirectory, ProxyFetchError } from "../../src/lib";

describe("custom errors - ProxyFetchError", () => {
  it("should create error with message", () => {
    const error = new ProxyFetchError("Test error");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ProxyFetchError");
    expect(error.message).toBe("Test error");
    expect(error.details).toEqual({});
  });

  it("should create error with message and details", () => {
    const details = { status: 404, code: "NOT_FOUND" };
    const error = new ProxyFetchError("Not found", details);

    expect(error.message).toBe("Not found");
    expect(error.details).toEqual(details);
  });

  it("should return status from details", () => {
    const error = new ProxyFetchError("Server error", { status: 500 });

    expect(error.status).toBe(500);
  });

  it("should throw error when accessing status without status property", () => {
    const error = new ProxyFetchError("Error without status");

    expect(() => error.status).toThrow("ProxyFetchError does not have a status property");
  });
});

describe("parseUnicodeDirectory", () => {
  it("should parse HTML directory listing", async () => {
    const mockHtml = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<head>
<title>Index of /Public</title>
</head>
<body>
<h1>Index of /Public</h1>
<table>
<tr><th valign="top"><img src="/icons/blank.gif" alt="[ICO]"></th><th><a href="?C=N;O=D">Name</a></th><th><a href="?C=M;O=A">Last modified</a></th><th><a href="?C=S;O=A">Size</a></th><th><a href="?C=D;O=A">Description</a></th></tr>
<tr><th colspan="5"><hr></th></tr>
<tr><td valign="top"><img src="/icons/back.gif" alt="[PARENTDIR]"></td><td><a href="/">Parent Directory</a></td><td>&nbsp;</td><td align="right">  - </td><td>&nbsp;</td></tr>
<tr><td valign="top"><img src="/icons/folder.gif" alt="[DIR]"></td><td><a href="15.1.0/">15.1.0/</a></td><td align="right">2023-09-12 17:45  </td><td align="right">  - </td><td>&nbsp;</td></tr>
<tr><td valign="top"><img src="/icons/text.gif" alt="[TXT]"></td><td><a href="UnicodeData.txt">UnicodeData.txt</a></td><td align="right">2023-09-12 17:45  </td><td align="right">1.9M</td><td>&nbsp;</td></tr>
</table>
</body>
</html>`;

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: "directory",
      name: "15.1.0",
      path: "/15.1.0",
      lastModified: expect.any(Number),
    });
    expect(result[1]).toEqual({
      type: "file",
      name: "UnicodeData.txt",
      path: "/UnicodeData.txt",
      lastModified: expect.any(Number),
    });
  });

  it("should trim trailing slashes from names and paths", async () => {
    const mockHtml = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<body>
<table>
<tr><td><img src="/icons/folder.gif" alt="[DIR]"></td><td><a href="folder/">folder/</a></td><td>2023-09-12 17:45</td><td>-</td><td></td></tr>
</table>
</body>
</html>`;

    const result = await parseUnicodeDirectory(mockHtml);

    expect(result[0]!.name).toBe("folder");
    expect(result[0]!.path).toBe("/folder");
  });

  it("should throw ProxyFetchError when parsing fails", async () => {
    const invalidHtml = "<html><body>Invalid content</body></html>";

    await expect(parseUnicodeDirectory(invalidHtml)).rejects.toThrow(ProxyFetchError);
    await expect(parseUnicodeDirectory(invalidHtml)).rejects.toThrow("Failed to parse the directory listing");
  });
});

describe("getEntryByPath", () => {
  describe("directory responses", () => {
    it("should fetch root directory when no path provided", async () => {
      const mockHtml = `<!DOCTYPE HTML>
<html><body>
<table>
<tr><td><img src="/icons/folder.gif" alt="[DIR]"></td><td><a href="15.1.0/">15.1.0/</a></td><td>2023-09-12 17:45</td><td>-</td><td></td></tr>
</table>
</body></html>`;

      mockFetch([
        ["GET", "https://unicode.org/Public?F=2", () => {
          return new HttpResponse(mockHtml, {
            status: 200,
            headers: {
              "Content-Type": "text/html",
              "Last-Modified": "Tue, 12 Sep 2023 17:45:00 GMT",
            },
          });
        }],
      ]);

      const result = await getEntryByPath();

      expect(result.type).toBe("directory");
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("15.1.0");
      expect(result.files[0].path).toBe("15.1.0");
      expect(result.headers).toBeInstanceOf(Headers);
      expect(result.headers.get("Content-Type")).toBe("text/html");
    });

    it("should fetch directory with path", async () => {
      const mockHtml = `<!DOCTYPE HTML>
<html><body>
<table>
<tr><td><img src="/icons/text.gif" alt="[TXT]"></td><td><a href="UnicodeData.txt">UnicodeData.txt</a></td><td>2023-09-12 17:45</td><td>1.9M</td><td></td></tr>
</table>
</body></html>`;

      mockFetch([
        ["GET", "https://unicode.org/Public/15.1.0?F=2", () => {
          return new HttpResponse(mockHtml, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      const result = await getEntryByPath("15.1.0");

      expect(result.type).toBe("directory");
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("UnicodeData.txt");
      expect(result.files[0].path).toBe("/15.1.0/UnicodeData.txt");
    });

    it("should set correct User-Agent header", async () => {
      let capturedRequest: Request | undefined;

      mockFetch([
        ["GET", "https://unicode.org/Public?F=2", ({ request }) => {
          capturedRequest = request;
          return new HttpResponse("<html><body><table></table></body></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      await getEntryByPath();

      expect(capturedRequest?.headers.get("User-Agent")).toBe(DEFAULT_USER_AGENT);
    });
  });

  describe("file responses", () => {
    it("should fetch file content as ArrayBuffer", async () => {
      const mockContent = new TextEncoder().encode("Unicode file content");

      mockFetch([
        ["GET", "https://unicode.org/Public/UnicodeData.txt?F=2", () => {
          return new HttpResponse(mockContent, {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
              "Content-Length": mockContent.length.toString(),
            },
          });
        }],
      ]);

      const result = await getEntryByPath("UnicodeData.txt");

      expect(result.type).toBe("file");
      expect(result.content).toBeInstanceOf(ArrayBuffer);
      expect(new TextDecoder().decode(result.content)).toBe("Unicode file content");
      expect(result.headers.get("Content-Type")).toBe("text/plain");
    });

    it("should handle HTML files as file content", async () => {
      const mockHtmlContent = "<html><body>HTML file content</body></html>";

      mockFetch([
        ["GET", "https://unicode.org/Public/doc/index.html?F=2", () => {
          return new HttpResponse(mockHtmlContent, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      const result = await getEntryByPath("doc/index.html");

      expect(result.type).toBe("file");
      expect(new TextDecoder().decode(result.content)).toBe(mockHtmlContent);
    });

    it("should handle binary files", async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

      mockFetch([
        ["GET", "https://unicode.org/Public/image.png?F=2", () => {
          return new HttpResponse(binaryData, {
            status: 200,
            headers: { "Content-Type": "image/png" },
          });
        }],
      ]);

      const result = await getEntryByPath("image.png");

      expect(result.type).toBe("file");
      expect(new Uint8Array(result.content)).toEqual(binaryData);
    });
  });

  describe("error handling", () => {
    it("should throw ProxyFetchError on 404", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/nonexistent?F=2", () => {
          return new HttpResponse("Not Found", {
            status: 404,
            statusText: "Not Found",
          });
        }],
      ]);

      await expect(getEntryByPath("nonexistent")).rejects.toThrow(ProxyFetchError);

      try {
        await getEntryByPath("nonexistent");
      } catch (error) {
        expect(error).toBeInstanceOf(ProxyFetchError);
        expect((error as ProxyFetchError).status).toBe(404);
        expect((error as ProxyFetchError).message).toBe("failed to fetch entry");
      }
    });

    it("should throw ProxyFetchError on 500", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/error?F=2", () => {
          return new HttpResponse("Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
          });
        }],
      ]);

      await expect(getEntryByPath("error")).rejects.toThrow(ProxyFetchError);

      try {
        await getEntryByPath("error");
      } catch (error) {
        expect(error).toBeInstanceOf(ProxyFetchError);
        expect((error as ProxyFetchError).status).toBe(500);
      }
    });

    it("should handle network errors", async () => {
      mockFetch([
        ["GET", "https://unicode.org/Public/network-error?F=2", () => {
          return Response.error();
        }],
      ]);

      await expect(getEntryByPath("network-error")).rejects.toThrow();
    });

    it("should throw ProxyFetchError when directory parsing fails", async () => {
      const invalidHtml = "<html><body>Invalid directory listing</body></html>";

      mockFetch([
        ["GET", "https://unicode.org/Public/invalid?F=2", () => {
          return new HttpResponse(invalidHtml, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      await expect(getEntryByPath("invalid")).rejects.toThrow(ProxyFetchError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty path string", async () => {
      const mockHtml = "<html><body><table></table></body></html>";

      mockFetch([
        ["GET", "https://unicode.org/Public?F=2", () => {
          return new HttpResponse(mockHtml, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      const result = await getEntryByPath("");

      expect(result.type).toBe("directory");
      expect(result.files).toEqual([]);
    });

    it("should handle content-type with charset", async () => {
      const mockContent = "Text content";

      mockFetch([
        ["GET", "https://unicode.org/Public/file.txt?F=2", () => {
          return new HttpResponse(mockContent, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }],
      ]);

      const result = await getEntryByPath("file.txt");

      expect(result.type).toBe("file");
      expect(new TextDecoder().decode(result.content)).toBe(mockContent);
    });

    it("should distinguish between HTML directory listing and HTML file", async () => {
      const htmlFileContent = "<html><head><title>Documentation</title></head><body>Content</body></html>";

      mockFetch([
        ["GET", "https://unicode.org/Public/docs/spec.html?F=2", () => {
          return new HttpResponse(htmlFileContent, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }],
      ]);

      const result = await getEntryByPath("docs/spec.html");

      expect(result.type).toBe("file");
      expect(new TextDecoder().decode(result.content)).toBe(htmlFileContent);
    });
  });
});
