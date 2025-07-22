import type { ApiError, ProxyResponse, UnicodeVersionList } from "../src";
import { mockFetch } from "#msw-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { client, createClient } from "../src";

describe("unicode API Client", () => {
  describe("createClient", () => {
    it("should create a client with the provided base URL", () => {
      const customBaseUrl = "https://custom-api.example.com";
      const customClient = createClient(customBaseUrl);

      expect(customClient).toBeDefined();
    });

    it("should create clients with different base URLs", () => {
      const baseUrls = [
        "https://api1.example.com",
        "https://api2.example.com",
        "http://localhost:3000",
      ];

      baseUrls.forEach((baseUrl) => {
        const testClient = createClient(baseUrl);
        expect(testClient).toBeDefined();
      });
    });
  });

  describe("default client", () => {
    it("should be created with the default base URL", () => {
      expect(client).toBeDefined();
    });
  });

  describe("/api/v1/versions endpoint", () => {
    const mockUnicodeVersions: UnicodeVersionList = [
      {
        version: "15.1.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
        date: "2023-09-12",
        url: "https://www.unicode.org/Public/15.1.0/ucd/",
        type: "stable",
        mappedUcdVersion: "15.1.0",
      },
      {
        version: "15.0.0",
        documentationUrl: "https://www.unicode.org/versions/Unicode15.0.0/",
        date: "2022-09-13",
        url: "https://www.unicode.org/Public/15.0.0/ucd/",
        type: "stable",
        mappedUcdVersion: "15.0.0",
      },
    ];

    describe("successful requests", () => {
      it("should fetch unicode versions successfully", async () => {
        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
            return new HttpResponse(JSON.stringify(mockUnicodeVersions), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, data, error } = await client.GET("/api/v1/versions");

        expect(data).toEqual(mockUnicodeVersions);
        expect(response.status).toBe(200);
        expect(error).toBeUndefined();
      });

      it("should return array of unicode versions with correct structure", async () => {
        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
            return new HttpResponse(JSON.stringify(mockUnicodeVersions), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { data, response, error } = await client.GET("/api/v1/versions");
        expect(response.status).toBe(200);
        expect(error).toBeUndefined();
        expect(data).toBeDefined();

        expect(Array.isArray(data)).toBe(true);
        expect(data?.length).toBe(2);

        expect(data?.[0]).toHaveProperty("version");
        expect(data?.[0]).toHaveProperty("documentationUrl");
        expect(data?.[0]).toHaveProperty("date");
        expect(data?.[0]).toHaveProperty("url");

        expect(data?.[0]?.documentationUrl).toMatch(/^https?:\/\//);
        expect(data?.[0]?.url).toMatch(/^https?:\/\//);
      });
    });

    describe("error handling", () => {
      it("should handle 404 Not Found errors", async () => {
        const errorResponse: ApiError = {
          message: "Resource not found",
          status: 404,
          timestamp: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
            return new HttpResponse(JSON.stringify(errorResponse), {
              status: 404,
              statusText: "Not Found",
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, error } = await client.GET("/api/v1/versions");

        expect(response.status).toBe(404);
        expect(error).toEqual(errorResponse);
      });

      it("should handle 500 Internal Server Error", async () => {
        const errorResponse: ApiError = {
          message: "Internal server error occurred",
          status: 500,
          timestamp: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
            return new HttpResponse(JSON.stringify(errorResponse), {
              status: 500,
              statusText: "Internal Server Error",
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, error } = await client.GET("/api/v1/versions");

        expect(response.status).toBe(500);
        expect(error).toEqual(errorResponse);
      });
    });
  });

  describe("/api/v1/unicode-proxy endpoint", () => {
    describe("successful requests", () => {
      it("should proxy requests without path successfully", async () => {
        const mockProxyResponse: ProxyResponse = {
          type: "directory",
          name: "root",
          path: "/",
          lastModified: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy`, () => {
            return new HttpResponse(JSON.stringify(mockProxyResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, data } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: {
              wildcard: "",
            },
          },
        });

        expect(data).toEqual(mockProxyResponse);
        expect(response.status).toBe(200);
      });

      it("should handle binary data responses", async () => {
        const binaryData = new Uint8Array([72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33]);

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy`, () => {
            return new HttpResponse(binaryData, {
              status: 200,
              headers: { "Content-Type": "application/octet-stream" },
            });
          }],
        ]);

        const { response, data } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: {
              wildcard: "",
            },
          },
          parseAs: "arrayBuffer",
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
        // eslint-disable-next-line node/prefer-global/buffer
        expect(Buffer.from(data!).toString()).toBe("Hello, World!");
      });
    });

    describe("error handling", () => {
      it("should handle 404 errors with proper structure", async () => {
        const errorResponse = {
          message: "Resource not found",
          status: 404,
          timestamp: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy`, () => {
            return new HttpResponse(JSON.stringify(errorResponse), {
              status: 404,
              statusText: "Not Found",
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const response = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: {
              wildcard: "",
            },
          },
        });

        expect(response.response.status).toBe(404);
        expect(response.error).toEqual(errorResponse);
      });
    });
  });

  describe("/api/v1/unicode-proxy/{path} endpoint", () => {
    describe("successful requests", () => {
      it("should proxy requests with path parameter successfully", async () => {
        const mockFileResponse: ProxyResponse = {
          type: "file",
          name: "ucd.all.json",
          path: "/latest/ucd.all.json",
          lastModified: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          // TODO: remove the need for encodeURIComponent here when https://github.com/openapi-ts/openapi-typescript/pull/2362 is fixed
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/${encodeURIComponent("latest/ucd.all.json")}`, () => {
            return new HttpResponse(JSON.stringify(mockFileResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, data } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: {
              wildcard: "latest/ucd.all.json",
            },
          },
        });

        expect(response.status).toBe(200);
        expect(data).toEqual(mockFileResponse);
      });

      it("should handle directory responses", async () => {
        const mockDirectoryResponse: ProxyResponse = {
          type: "directory",
          name: "latest",
          path: "/latest",
          lastModified: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/latest`, () => {
            return new HttpResponse(JSON.stringify(mockDirectoryResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { data } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: { wildcard: "latest" },
          },
        });

        expect(data).toEqual(mockDirectoryResponse);
        expect(data).toBeDefined();
        expect(data).toBeTypeOf("object");
        expect((data as any).type).toBe("directory");
      });

      it.each([
        ["latest/ucd.all.json"],
        ["15.1.0/ucd/UnicodeData.txt"],
        ["auxiliary/GraphemeBreakProperty.txt"],
      ])("should handle path parameter: %s", async (path) => {
        const mockResponse = {
          type: "file" as const,
          name: path.split("/").pop() || "",
          path: `/${path}`,
          lastModified: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          // TODO: remove the need for encodeURIComponent here when https://github.com/openapi-ts/openapi-typescript/pull/2362 is fixed
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/${encodeURIComponent(path)}`, () => {
            return new HttpResponse(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, data } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: {
              wildcard: path,
            },
          },
        });

        expect(data).toEqual(mockResponse);
        expect(response.status).toBe(200);
      });
    });

    describe("error handling", () => {
      it("should handle 404 errors for non-existent paths", async () => {
        const errorResponse = {
          message: "Path not found: /non-existent/path",
          status: 404,
          path: "/api/v1/unicode-proxy/non-existent/path",
          timestamp: "2025-06-26T12:00:00Z",
        };

        mockFetch([
          // TODO: remove the need for encodeURIComponent here when https://github.com/openapi-ts/openapi-typescript/pull/2362 is fixed
          ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/${encodeURIComponent("non-existent/path")}`, () => {
            return new HttpResponse(JSON.stringify(errorResponse), {
              status: 404,
              statusText: "Not Found",
              headers: { "Content-Type": "application/json" },
            });
          }],
        ]);

        const { response, error } = await client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: {
            path: { wildcard: "non-existent/path" },
          },
        });

        expect(response.status).toBe(404);
        expect(error).toEqual(errorResponse);
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle concurrent requests to different endpoints", async () => {
      const unicodeVersions: UnicodeVersionList = [
        {
          version: "15.1.0",
          documentationUrl: "https://www.unicode.org/versions/Unicode15.1.0/",
          date: "2023-09-12",
          url: "https://www.unicode.org/Public/15.1.0/ucd/",
          type: "stable",
          mappedUcdVersion: "15.1.0",
        },
      ];

      const proxyResponse: ProxyResponse = {
        type: "directory",
        name: "latest",
        path: "/latest",
        lastModified: "2025-06-26T12:00:00Z",
      };

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return new HttpResponse(JSON.stringify(unicodeVersions), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/unicode-proxy/latest`, () => {
          return new HttpResponse(JSON.stringify(proxyResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const [versionsResponse, proxyLatestResponse] = await Promise.all([
        client.GET("/api/v1/versions"),
        client.GET("/api/v1/unicode-proxy/{wildcard}", {
          params: { path: { wildcard: "latest" } },
        }),
      ]);

      expect(versionsResponse.data).toEqual(unicodeVersions);
      expect(proxyLatestResponse.data).toEqual(proxyResponse);
    });

    it("should work with custom client instances", async () => {
      const customBaseUrl = "https://custom-unicode-api.example.com";
      const customClient = createClient(customBaseUrl);

      const mockVersions: UnicodeVersionList = [
        {
          version: "16.0.0",
          documentationUrl: "https://www.unicode.org/versions/Unicode16.0.0/",
          date: "2024-09-10",
          url: "https://www.unicode.org/Public/16.0.0/ucd/",
          type: "stable",
          mappedUcdVersion: "16.0.0",
        },
      ];

      mockFetch([
        ["GET", `${customBaseUrl}/api/v1/versions`, () => {
          return new HttpResponse(JSON.stringify(mockVersions), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      const { data } = await customClient.GET("/api/v1/versions");
      expect(data).toEqual(mockVersions);
    });

    it("should handle request headers correctly", async () => {
      let capturedRequest: Request | undefined;

      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, ({
          request,
        }) => {
          capturedRequest = request;
          return new HttpResponse(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }],
      ]);

      await client.GET("/api/v1/versions", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(capturedRequest?.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle network errors gracefully", async () => {
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return Response.error();
        }],
      ]);

      try {
        await client.GET("/api/v1/versions");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
