import { describe, expect, it } from "vitest";
import {
  resolveUCDStoreOptions,
} from "../src/store";

describe("resolveUCDStoreOptions", () => {
  it("should use default values when no options are provided", () => {
    const options = resolveUCDStoreOptions({});

    expect(options.baseUrl).toBe("https://unicode-api.luxass.dev/api/v1");
    expect(options.proxyUrl).toBe("https://unicode-proxy.ucdjs.dev");
    expect(options.filters).toEqual([]);
  });

  it("should override default values with provided options", () => {
    const options = resolveUCDStoreOptions({
      baseUrl: "custom-base-url",
      proxyUrl: "custom-proxy-url",
      filters: ["filter1", "filter2"],
    });

    expect(options.baseUrl).toBe("custom-base-url");
    expect(options.proxyUrl).toBe("custom-proxy-url");
    expect(options.filters).toEqual(["filter1", "filter2"]);
  });

  it("should merge extra options", () => {
    const options = resolveUCDStoreOptions({}, { extraOption: "value" });

    expect(options.baseUrl).toBe("https://unicode-api.luxass.dev/api/v1");
    expect(options.proxyUrl).toBe("https://unicode-proxy.ucdjs.dev");
    expect(options.filters).toEqual([]);
    expect(options.extraOption).toBe("value");
  });
});
