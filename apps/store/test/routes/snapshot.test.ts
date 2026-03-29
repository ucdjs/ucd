import type { Snapshot } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store snapshot route", () => {
  it("should return snapshot for existing version", async () => {
    const mockSnapshotData: Snapshot = {
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

    const mockBucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/snapshot.json") {
          return Promise.resolve({
            json: () => Promise.resolve(mockSnapshotData),
          });
        }
        return Promise.resolve(null);
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toContain("max-age=86400");

    const snapshot = await json() as Snapshot;
    expect(snapshot.unicodeVersion).toBe("17.0.0");
    expect(Object.keys(snapshot.files)).toHaveLength(3);
    expect(snapshot.files["UnicodeData.txt"]).toMatchObject({
      hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
      fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      size: 123,
    });
    expect(snapshot.files["Blocks.txt"]).toBeDefined();
    expect(snapshot.files["emoji/emoji-data.txt"]).toBeDefined();

    expect(mockBucket.get).toHaveBeenCalledWith("manifest/17.0.0/snapshot.json");
  });

  it("should return 404 when snapshot does not exist", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue(null),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/99.0.0/snapshot.json"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(404);
    const data = await json() as { status: number; message: string };
    expect(data.status).toBe(404);
    expect(data.message).toContain("Snapshot not found");
    expect(data.message).toContain("99.0.0");
  });

  it("should return 502 when UCD_BUCKET is not configured", async () => {
    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
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

  it("should handle R2 errors gracefully", async () => {
    const mockBucket = {
      get: vi.fn().mockRejectedValue(new Error("R2 connection failed")),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
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

  it("should handle empty snapshot gracefully", async () => {
    const mockSnapshotData: Snapshot = {
      unicodeVersion: "17.0.0",
      files: {},
    };

    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockSnapshotData),
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    const snapshot = await json() as Snapshot;
    expect(snapshot.unicodeVersion).toBe("17.0.0");
    expect(Object.keys(snapshot.files)).toHaveLength(0);
  });

  it("should return 502 for snapshot with missing files", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ unicodeVersion: "17.0.0" }),
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
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

  it("should return 502 for malformed snapshot data", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ unicodeVersion: "17.0.0", files: null }),
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/17.0.0/snapshot.json"),
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

  it("should return snapshot payload for another version", async () => {
    const mockSnapshotData: Snapshot = {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:4444444444444444444444444444444444444444444444444444444444444444",
          fileHash: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          size: 321,
        },
      },
    };

    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockSnapshotData),
      }),
    };

    const { response, json } = await executeRequest(
      new Request("https://ucd-store.ucdjs.dev/16.0.0/snapshot.json"),
      {
        ...env,
        UCD_BUCKET: mockBucket as unknown as Cloudflare.Env["UCD_BUCKET"],
      } as unknown as Cloudflare.Env,
    );

    expect(response.status).toBe(200);
    const snapshot = await json() as Snapshot;
    expect(snapshot.unicodeVersion).toBe("16.0.0");
    expect(snapshot.files["UnicodeData.txt"]).toMatchObject({
      size: 321,
    });
  });
});
