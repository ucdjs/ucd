import type { Lockfile } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store lockfile route", () => {
  it("should return lockfile with versions from R2", async () => {
    const mockSnapshot17 = {
      unicodeVersion: "17.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          size: 123,
        },
        "Blocks.txt": {
          hash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          fileHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          size: 456,
        },
        "emoji/emoji-data.txt": {
          hash: "sha256:3333333333333333333333333333333333333333333333333333333333333333",
          fileHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
          size: 789,
        },
      },
    };
    const mockSnapshot16 = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:4444444444444444444444444444444444444444444444444444444444444444",
          fileHash: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          size: 321,
        },
      },
    };

    const mockUploadedDate = new Date("2024-01-15T10:30:00Z");

    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/snapshot.json",
            uploaded: mockUploadedDate,
            size: 1024,
          },
          {
            key: "manifest/16.0.0/snapshot.json",
            uploaded: new Date("2023-09-15T10:30:00Z"),
            size: 1024,
          },
        ],
      }),
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/snapshot.json") {
          return Promise.resolve({
            json: () => Promise.resolve(mockSnapshot17),
          });
        }
        if (key === "manifest/16.0.0/snapshot.json") {
          return Promise.resolve({
            json: () => Promise.resolve(mockSnapshot16),
          });
        }
        return Promise.resolve(null);
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const lockfile = await json() as Lockfile;
    expect(lockfile.lockfileVersion).toBe(1);
    expect(lockfile.versions["17.0.0"]).toMatchObject({
      path: "17.0.0/snapshot.json",
      fileCount: 3,
      totalSize: 1368,
    });
    expect(lockfile.versions["16.0.0"]).toMatchObject({
      path: "16.0.0/snapshot.json",
      fileCount: 1,
      totalSize: 321,
    });

    expect(mockBucket.list).toHaveBeenCalledWith({ prefix: "manifest/" });
    expect(mockBucket.get).toHaveBeenCalledWith("manifest/17.0.0/snapshot.json");
    expect(mockBucket.get).toHaveBeenCalledWith("manifest/16.0.0/snapshot.json");
  });

  it("should return 502 when UCD_BUCKET is not configured", async () => {
    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: undefined as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(502);
    const data = await json() as { status: number; message: string };
    expect(data.status).toBe(502);
    expect(data.message).toBe("Bad Gateway");
  });

  it("should return empty versions when no snapshots exist", async () => {
    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [],
      }),
      get: vi.fn(),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    const lockfile = await json() as Lockfile;
    expect(lockfile.versions).toEqual({});
    expect(lockfile.lockfileVersion).toBe(1);
  });

  it("should handle R2 errors gracefully", async () => {
    const mockBucket = {
      list: vi.fn().mockRejectedValue(new Error("R2 connection failed")),
      get: vi.fn(),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(502);
    const data = await json() as { status: number; message: string };
    expect(data.status).toBe(502);
    expect(data.message).toBe("Bad Gateway");
  });

  it("should skip non-snapshot files in R2 listing", async () => {
    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/snapshot.json",
            uploaded: new Date("2024-01-15T10:30:00Z"),
            size: 1024,
          },
          {
            key: "manifest/17.0.0/other-file.txt",
            uploaded: new Date("2024-01-15T10:30:00Z"),
            size: 100,
          },
          {
            key: "some-other-prefix/file.json",
            uploaded: new Date("2024-01-15T10:30:00Z"),
            size: 100,
          },
        ],
      }),
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          unicodeVersion: "17.0.0",
          files: {
            "test.txt": {
              hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
              fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              size: 100,
            },
          },
        }),
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    const lockfile = await json() as Lockfile;
    expect(Object.keys(lockfile.versions)).toHaveLength(1);
    expect(lockfile.versions["17.0.0"]).toBeDefined();
  });

  it("should skip snapshots that cannot be fetched", async () => {
    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/snapshot.json",
            uploaded: new Date("2024-01-15T10:30:00Z"),
            size: 1024,
          },
          {
            key: "manifest/16.0.0/snapshot.json",
            uploaded: new Date("2023-09-15T10:30:00Z"),
            size: 1024,
          },
        ],
      }),
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/snapshot.json") {
          return Promise.resolve({
            json: () => Promise.resolve({
              unicodeVersion: "17.0.0",
              files: {
                "test.txt": {
                  hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
                  fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                  size: 100,
                },
              },
            }),
          });
        }
        // Return null for 16.0.0 - simulating missing snapshot
        return Promise.resolve(null);
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/.ucd-store.lock"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    const lockfile = await json() as Lockfile;
    expect(Object.keys(lockfile.versions)).toHaveLength(1);
    expect(lockfile.versions["17.0.0"]).toBeDefined();
    expect(lockfile.versions["16.0.0"]).toBeUndefined();
  });
});
