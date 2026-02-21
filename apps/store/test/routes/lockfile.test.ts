import type { Lockfile } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store lockfile route", () => {
  it("should return lockfile with versions from R2", async () => {
    const mockManifestData = {
      expectedFiles: [
        "17.0.0/ucd/UnicodeData.txt",
        "17.0.0/ucd/Blocks.txt",
        "17.0.0/ucd/emoji/emoji-data.txt",
      ],
    };

    const mockUploadedDate = new Date("2024-01-15T10:30:00Z");

    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/manifest.json",
            uploaded: mockUploadedDate,
            size: 1024,
          },
          {
            key: "manifest/16.0.0/manifest.json",
            uploaded: new Date("2023-09-15T10:30:00Z"),
            size: 1024,
          },
        ],
      }),
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/manifest.json") {
          return Promise.resolve({
            json: () => Promise.resolve(mockManifestData),
          });
        }
        if (key === "manifest/16.0.0/manifest.json") {
          return Promise.resolve({
            json: () => Promise.resolve({ expectedFiles: ["16.0.0/ucd/UnicodeData.txt"] }),
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
    });
    expect(lockfile.versions["16.0.0"]).toMatchObject({
      path: "16.0.0/snapshot.json",
      fileCount: 1,
    });

    expect(mockBucket.list).toHaveBeenCalledWith({ prefix: "manifest/" });
    expect(mockBucket.get).toHaveBeenCalledWith("manifest/17.0.0/manifest.json");
    expect(mockBucket.get).toHaveBeenCalledWith("manifest/16.0.0/manifest.json");
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

  it("should return empty versions when no manifests exist", async () => {
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

  it("should skip non-manifest files in R2 listing", async () => {
    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/manifest.json",
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
        json: () => Promise.resolve({ expectedFiles: ["test.txt"] }),
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

  it("should skip manifests that cannot be fetched", async () => {
    const mockBucket = {
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: "manifest/17.0.0/manifest.json",
            uploaded: new Date("2024-01-15T10:30:00Z"),
            size: 1024,
          },
          {
            key: "manifest/16.0.0/manifest.json",
            uploaded: new Date("2023-09-15T10:30:00Z"),
            size: 1024,
          },
        ],
      }),
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/manifest.json") {
          return Promise.resolve({
            json: () => Promise.resolve({ expectedFiles: ["test.txt"] }),
          });
        }
        // Return null for 16.0.0 - simulating missing manifest
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
