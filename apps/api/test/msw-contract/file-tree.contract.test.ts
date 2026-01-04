/// <reference types="../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { UnicodeFileTree } from "@ucdjs/schemas";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, passthrough } from "#test-utils/msw";
import { UnicodeFileTreeSchema } from "@ucdjs/schemas";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../helpers/request";

describe("msw file-tree handler contract", () => {
  it("unwraps top-level ucd directory and keeps /{version}/ucd paths", async () => {
    const customTree = [
      {
        type: "directory" as const,
        name: "ucd",
        lastModified: 0,
        children: [
          {
            type: "file" as const,
            name: "UnicodeData.txt",
            lastModified: 0,
            _content: "data",
          },
        ],
      },
    ];

    mockStoreApi({
      files: {
        "16.0.0": customTree,
      },
      responses: {
        "/api/v1/versions/{version}/file-tree": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/versions/16.0.0/file-tree") {
          expect.fail(`The requested path should be /api/v1/versions/16.0.0/file-tree`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/16.0.0/ucd", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/auxiliary", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/emoji", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/extracted", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
    );
    expect(mswResponse.ok).toBe(true);
    const mswData = await mswResponse.json() as any[];

    expect(Array.isArray(mswData)).toBe(true);
    expect(mswData).toHaveLength(1);
    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "UnicodeData.txt",
        path: "/16.0.0/ucd/UnicodeData.txt",
      }),
    ]));
    expect(mswData.find((entry: any) => entry.name === "ucd")).toBeUndefined();

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<any[]>();

    expect(Array.isArray(apiData)).toBe(true);
    expect(apiData.length).toBeGreaterThan(0);
    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "UnicodeData.txt",
        path: "/16.0.0/ucd/UnicodeData.txt",
      }),
    ]));

    expect(mswData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });

  it("falls back to wildcard files but rewrites paths with the requested version", async () => {
    const wildcardTree = [
      {
        type: "directory" as const,
        name: "ucd",
        lastModified: 0,
        children: [
          {
            type: "file" as const,
            name: "Blocks.txt",
            lastModified: 0,
            _content: "blocks",
          },
        ],
      },
    ];

    mockStoreApi({
      files: {
        "*": wildcardTree,
      },
      responses: {
        "/api/v1/versions/{version}/file-tree": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/versions/17.0.0/file-tree") {
          expect.fail(`The requested path should be /api/v1/versions/17.0.0/file-tree`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/17.0.0/ucd", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/auxiliary", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/emoji", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/extracted", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/versions/17.0.0/file-tree",
    );
    expect(mswResponse.ok).toBe(true);
    const mswData = await mswResponse.json<UnicodeFileTree>();

    expect(Array.isArray(mswData)).toBe(true);
    expect(mswData).toHaveLength(1);
    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "Blocks.txt",
        path: "/17.0.0/ucd/Blocks.txt",
      }),
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/versions/17.0.0/file-tree"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<UnicodeFileTree>();

    expect(Array.isArray(apiData)).toBe(true);
    expect(apiData.length).toBeGreaterThan(0);
    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "Blocks.txt",
        path: "/17.0.0/ucd/Blocks.txt",
      }),
    ]));

    expect(mswData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });

  it("resolves latest alias to the stable version and keeps prefixed paths", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions/{version}/file-tree": ({ params }) => {
          const requestedVersion = params.version as string;
          const resolvedVersion = requestedVersion === "latest" ? UNICODE_STABLE_VERSION : requestedVersion;

          return HttpResponse.json([
            {
              type: "file",
              name: "ArabicShaping.txt",
              path: `/${resolvedVersion}/ucd/ArabicShaping.txt`,
              lastModified: 0,
            },
          ]);
        },
      },
      onRequest({ path }) {
        if (path !== "/api/v1/versions/latest/file-tree") {
          expect.fail(`The requested path should be /api/v1/versions/latest/file-tree`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/17.0.0/ucd", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/auxiliary", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/emoji", () => {
          return passthrough();
        }],
        ["GET", "https://unicode.org/Public/17.0.0/ucd/extracted", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/versions/latest/file-tree",
    );
    expect(mswResponse.ok).toBe(true);
    const mswData = await mswResponse.json<UnicodeFileTree>();

    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "ArabicShaping.txt",
        path: `/${UNICODE_STABLE_VERSION}/ucd/ArabicShaping.txt`,
      }),
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/versions/latest/file-tree"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<UnicodeFileTree>();

    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "ArabicShaping.txt",
        path: `/${UNICODE_STABLE_VERSION}/ucd/ArabicShaping.txt`,
      }),
    ]));

    expect(mswData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });

  it("returns 400 for invalid Unicode version", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/versions/{version}/file-tree": () => HttpResponse.json({
          message: "Invalid Unicode version",
          status: 400,
          timestamp: new Date().toISOString(),
        }, { status: 400 }),
      },
      onRequest({ path }) {
        if (path !== "/api/v1/versions/99.0.0/file-tree") {
          expect.fail(`The requested path should be /api/v1/versions/99.0.0/file-tree`);
        }
      },
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/versions/99.0.0/file-tree",
    );
    expect(mswResponse.ok).toBe(false);
    expect(mswResponse.status).toBe(400);
    const mswError = await mswResponse.json();
    expect(mswError).toEqual(expect.objectContaining({
      message: expect.any(String),
      status: 400,
    }));

    const { response: apiResponse } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/versions/99.0.0/file-tree"),
      env,
    );
    expect(apiResponse.ok).toBe(false);
    expect(apiResponse.status).toBe(400);
    const apiError = await apiResponse.json();
    expect(apiError).toEqual(expect.objectContaining({
      message: expect.any(String),
      status: 400,
    }));
  });

  it("preserves nested directory paths under /{version}/ucd", async () => {
    const nestedTree = [
      {
        type: "directory" as const,
        name: "ucd",
        lastModified: 0,
        children: [
          {
            type: "directory" as const,
            name: "emoji",
            lastModified: 0,
            children: [
              {
                type: "file" as const,
                name: "emoji-data.txt",
                lastModified: 0,
                _content: "emoji",
              },
            ],
          },
        ],
      },
    ];

    mockStoreApi({
      files: {
        "16.0.0": nestedTree,
      },
      responses: {
        "/api/v1/versions/{version}/file-tree": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/versions/16.0.0/file-tree") {
          expect.fail(`The requested path should be /api/v1/versions/16.0.0/file-tree`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/16.0.0/ucd", () => passthrough()],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/emoji", () => passthrough()],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/auxiliary", () => passthrough()],
        ["GET", "https://unicode.org/Public/16.0.0/ucd/extracted", () => passthrough()],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree",
    );
    expect(mswResponse.ok).toBe(true);
    const mswData = await mswResponse.json<UnicodeFileTree>();

    expect(mswData).toEqual(expect.arrayContaining([
      {
        type: "directory",
        name: "emoji",
        path: "/16.0.0/ucd/emoji/",
        children: expect.arrayContaining([
          {
            type: "file",
            name: "emoji-data.txt",
            path: "/16.0.0/ucd/emoji/emoji-data.txt",
            lastModified: expect.any(Number),
          },
        ]),
        lastModified: expect.any(Number),
      },
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/versions/16.0.0/file-tree"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<UnicodeFileTree>();

    expect(apiData).toEqual(expect.arrayContaining([
      {
        type: "directory",
        name: "emoji",
        path: "/16.0.0/ucd/emoji/",
        children: expect.arrayContaining([
          {
            type: "file",
            name: "emoji-data.txt",
            path: "/16.0.0/ucd/emoji/emoji-data.txt",
            lastModified: expect.any(Number),
          },
        ]),
        lastModified: expect.any(Number),
      },
    ]));

    expect(mswData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: UnicodeFileTreeSchema,
      success: true,
    });
  });
});
