import { describe, expect, it } from "vitest";
import {
  getApiOriginForEnvironment,
  getOriginsForEnvironment,
  getStoreOriginForEnvironment,
} from "../src/environment";

describe("environment module", () => {
  it("maps environments to API origins", () => {
    expect(getApiOriginForEnvironment("production")).toBe("https://api.ucdjs.dev");
    expect(getApiOriginForEnvironment("preview")).toBe("https://preview.api.ucdjs.dev");
    expect(getApiOriginForEnvironment("local")).toBe("http://localhost:8787");
    expect(getApiOriginForEnvironment(undefined)).toBe("http://localhost:8787");
    expect(getApiOriginForEnvironment("testing")).toBe("http://localhost:8787");
  });

  it("returns allowed CORS origins for each environment", () => {
    expect(getOriginsForEnvironment("local")).toEqual([
      "http://localhost:3000",
      "http://localhost:8787",
    ]);

    expect(getOriginsForEnvironment("preview")).toEqual([
      "https://ucdjs.dev",
      "https://www.ucdjs.dev",
      "https://preview.api.ucdjs.dev",
      "https://preview.unicode-proxy.ucdjs.dev",
    ]);

    expect(getOriginsForEnvironment("production")).toEqual([
      "https://ucdjs.dev",
      "https://www.ucdjs.dev",
    ]);

    expect(getOriginsForEnvironment(undefined)).toEqual([
      "https://ucdjs.dev",
      "https://www.ucdjs.dev",
    ]);
  });

  it("maps environments to store origin", () => {
    expect(getStoreOriginForEnvironment("production")).toBe("https://ucd-store.ucdjs.dev");
    expect(getStoreOriginForEnvironment("preview")).toBe("https://preview.ucd-store.ucdjs.dev");
    expect(getStoreOriginForEnvironment("local")).toBe("http://ucd-store.localhost:8787");
    expect(getStoreOriginForEnvironment(undefined)).toBe("http://ucd-store.localhost:8787");
  });
});
