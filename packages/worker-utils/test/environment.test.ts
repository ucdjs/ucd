import { describe, expect, it } from "vitest";
import { getApiOriginForEnvironment } from "../src/environment";

describe("environment module", () => {
  it("maps environments to API origins", () => {
    expect(getApiOriginForEnvironment("production")).toBe("https://api.ucdjs.dev");
    expect(getApiOriginForEnvironment("preview")).toBe("https://preview.api.ucdjs.dev");
    expect(getApiOriginForEnvironment("local")).toBe("http://localhost:8787");
    expect(getApiOriginForEnvironment(undefined)).toBe("http://localhost:8787");
  });
});
