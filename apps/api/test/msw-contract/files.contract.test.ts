/// <reference types="../../../../packages/test-utils/src/matchers/types.d.ts" />

import type { FileEntryList } from "@ucdjs/schemas";
import { mockStoreApi } from "#test-utils/mock-store";
import { passthrough } from "#test-utils/msw";
import {
  UCD_STAT_CHILDREN_DIRS_HEADER,
  UCD_STAT_CHILDREN_FILES_HEADER,
  UCD_STAT_CHILDREN_HEADER,
  UCD_STAT_SIZE_HEADER,
  UCD_STAT_TYPE_HEADER,
} from "@ucdjs/env";
import { FileEntryListSchema } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { executeRequest } from "../helpers/request";

describe("msw files handler contract", () => {
  it("lists versioned /{version}/ucd directory entries", async () => {
    const files = [
      {
        type: "file" as const,
        name: "UnicodeData.txt",
        lastModified: 0,
        _content: "data",
      },
      {
        type: "file" as const,
        name: "Blocks.txt",
        lastModified: 0,
        _content: "blocks",
      },
    ];

    mockStoreApi({
      files: {
        "16.0.0": files,
      },
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files/16.0.0/ucd") {
          expect.fail(`The requested path should not have been requested, only /api/v1/files/16.0.0/ucd was expected.`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/16.0.0/ucd", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files/16.0.0/ucd",
    );
    const mswData = await mswResponse.json<FileEntryList>();

    expect(Array.isArray(mswData)).toBe(true);
    expect(mswData).toHaveLength(2);
    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt" }),
      expect.objectContaining({ name: "Blocks.txt", path: "/16.0.0/ucd/Blocks.txt" }),
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/16.0.0/ucd"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<FileEntryList>();

    expect(Array.isArray(apiData)).toBe(true);
    expect(apiData.length).toBeGreaterThan(2);
    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt" }),
      expect.objectContaining({ name: "Blocks.txt", path: "/16.0.0/ucd/Blocks.txt" }),
    ]));

    expect(mswData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });
  });

  it("falls back to wildcard files and rewrites paths with requested version", async () => {
    const files = [
      {
        type: "file" as const,
        name: "Scripts.txt",
        lastModified: 0,
        _content: "scripts",
      },
    ];

    mockStoreApi({
      files: {
        "*": files,
      },
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files/17.0.0/ucd") {
          expect.fail(`The requested path should not have been requested, only /api/v1/files/17.0.0/ucd was expected.`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/17.0.0/ucd", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files/17.0.0/ucd",
    );
    const mswData = await mswResponse.json<FileEntryList>();

    expect(Array.isArray(mswData)).toBe(true);
    expect(mswData).toHaveLength(1);
    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Scripts.txt", path: "/17.0.0/ucd/Scripts.txt" }),
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/17.0.0/ucd"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<FileEntryList>();

    expect(Array.isArray(apiData)).toBe(true);
    expect(apiData.length).toBeGreaterThan(0);
    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Scripts.txt", path: "/17.0.0/ucd/Scripts.txt" }),
    ]));

    expect(mswData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });
  });

  it("lists root /api/v1/files directory entries", async () => {
    const rootFiles = [
      {
        type: "file" as const,
        name: "ReadMe.txt",
        lastModified: 0,
        _content: "ReadMe!",
      },
      {
        type: "directory" as const,
        name: "17.0.0",
        lastModified: 0,
        children: [],
      },
    ];

    mockStoreApi({
      files: {
        root: rootFiles,
      },
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files") {
          expect.fail(`The requested path should not have been requested, only /api/v1/files was expected.`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files",
    );
    const mswData = await mswResponse.json<FileEntryList>();

    expect(Array.isArray(mswData)).toBe(true);
    expect(mswData).toHaveLength(2);
    expect(mswData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "ReadMe.txt", path: "/ReadMe.txt" }),
      expect.objectContaining({ name: "17.0.0", path: "/17.0.0/" }),
    ]));

    const { response: apiResponse, json } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files"),
      env,
    );
    expect(apiResponse.ok).toBe(true);
    const apiData = await json<FileEntryList>();

    expect(Array.isArray(apiData)).toBe(true);
    expect(apiData.length).toBeGreaterThan(2);
    expect(apiData).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "ReadMe.txt", path: "/ReadMe.txt" }),
      expect.objectContaining({ name: "17.0.0", path: "/17.0.0/" }),
    ]));

    expect(mswData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });

    expect(apiData).toMatchSchema({
      schema: FileEntryListSchema,
      success: true,
    });
  });

  it("returns 404 for non-existent path", async () => {
    mockStoreApi({
      files: {
        root: [],
      },
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files/nonexistent.txt") {
          expect.fail(`The requested path should not have been requested, only /api/v1/files/nonexistent.txt was expected.`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/nonexistent.txt", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files/nonexistent.txt",
    );

    expect(mswResponse.ok).toBe(false);
    expect(mswResponse.status).toBe(404);

    const { response: apiResponse } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/nonexistent.txt"),
      env,
    );

    expect(apiResponse.ok).toBe(false);
    expect(apiResponse.status).toBe(404);
  });

  it("serves file content with correct headers", async () => {
    mockStoreApi({
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files/17.0.0/ucd/ArabicShaping.txt") {
          expect.fail(`The requested path should be /api/v1/files/17.0.0/ucd/ArabicShaping.txt`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public/17.0.0/ucd/ArabicShaping.txt", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files/17.0.0/ucd/ArabicShaping.txt",
    );

    expect(mswResponse.ok).toBe(true);
    const mswContent = await mswResponse.text();
    expect(mswResponse.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(mswResponse.headers.get(UCD_STAT_TYPE_HEADER)).toBe("file");
    expect(mswResponse.headers.get(UCD_STAT_SIZE_HEADER)).toBeDefined();

    const { response: apiResponse, text } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files/17.0.0/ucd/ArabicShaping.txt"),
      env,
    );

    expect(apiResponse.ok).toBe(true);
    const apiContent = await text();
    expect(apiContent).toBe(mswContent);
    expect(apiResponse.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(apiResponse.headers.get(UCD_STAT_TYPE_HEADER)).toBe("file");
    expect(apiResponse.headers.get(UCD_STAT_SIZE_HEADER)).toBeDefined();
  });

  it("sets correct headers for directory listing", async () => {
    const rootFiles = [
      {
        type: "file" as const,
        name: "ReadMe.txt",
        lastModified: 0,
        _content: "ReadMe!",
      },
      {
        type: "directory" as const,
        name: "Files",
        lastModified: 0,
        children: [],
      },
    ];

    mockStoreApi({
      files: {
        root: rootFiles,
      },
      responses: {
        "/api/v1/files/{wildcard}": true,
      },
      onRequest({ path }) {
        if (path !== "/api/v1/files") {
          expect.fail(`The requested path should not have been requested, only /api/v1/files was expected.`);
        }
      },
      customResponses: [
        ["GET", "https://unicode.org/Public", () => {
          return passthrough();
        }],
      ],
    });

    const mswResponse = await fetch(
      "https://api.ucdjs.dev/api/v1/files",
    );

    expect(mswResponse.ok).toBe(true);
    expect(mswResponse.headers.get(UCD_STAT_TYPE_HEADER)).toBe("directory");
    expect(mswResponse.headers.get(UCD_STAT_CHILDREN_HEADER)).toBe("2");
    expect(mswResponse.headers.get(UCD_STAT_CHILDREN_FILES_HEADER)).toBe("1");
    expect(mswResponse.headers.get(UCD_STAT_CHILDREN_DIRS_HEADER)).toBe("1");

    const { response: apiResponse } = await executeRequest(
      new Request("https://api.ucdjs.dev/api/v1/files"),
      env,
    );

    expect(apiResponse.ok).toBe(true);
    expect(apiResponse.headers.get(UCD_STAT_TYPE_HEADER)).toBe("directory");
    expect(apiResponse.headers.get(UCD_STAT_CHILDREN_HEADER)).toBeDefined();
    expect(apiResponse.headers.get(UCD_STAT_CHILDREN_FILES_HEADER)).toBeDefined();
    expect(apiResponse.headers.get(UCD_STAT_CHILDREN_DIRS_HEADER)).toBeDefined();
  });
});
