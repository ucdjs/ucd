import type { Snapshot } from "@ucdjs/schemas";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { executeRequest } from "../helpers/request";

describe("store snapshot route", () => {
  it("should return snapshot for existing version", async () => {
    const mockManifestData = {
      expectedFiles: [
        "17.0.0/ucd/UnicodeData.txt",
        "17.0.0/ucd/Blocks.txt",
        "17.0.0/ucd/emoji/emoji-data.txt",
      ],
    };

    const mockBucket = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "manifest/17.0.0/manifest.json") {
          return Promise.resolve({
            json: () => Promise.resolve(mockManifestData),
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
      hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      fileHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      size: 0,
    });
    expect(snapshot.files["Blocks.txt"]).toBeDefined();
    expect(snapshot.files["emoji/emoji-data.txt"]).toBeDefined();

    expect(mockBucket.get).toHaveBeenCalledWith("manifest/17.0.0/manifest.json");
  });

  it("should return 404 when manifest does not exist", async () => {
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
    expect(data.message).toContain("Manifest not found");
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

  it("should handle empty manifest gracefully", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ expectedFiles: [] }),
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

  it("should handle manifest with missing expectedFiles", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
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

  it("should handle malformed manifest data", async () => {
    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ expectedFiles: null }),
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

  it("should handle various version formats", async () => {
    const mockManifestData = {
      expectedFiles: ["16.0.0/ucd/UnicodeData.txt"],
    };

    const mockBucket = {
      get: vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockManifestData),
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
    expect(snapshot.files["UnicodeData.txt"]).toBeDefined();
  });
});
