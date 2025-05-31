import type { UCDStoreOptions } from "../src/index";
import { describe, expect, it } from "vitest";
import { createUCDStore, UCDStore } from "../src/index";
import { DEFAULT_STORE_OPTIONS } from "../src/store";

describe("createUCDStore", () => {
  it("should return a UCDStore instance", () => {
    const options: UCDStoreOptions = {};
    const store = createUCDStore(options);

    expect(store).toBeInstanceOf(UCDStore);
  });

  it("should pass options to UCDStore constructor", () => {
    const options: UCDStoreOptions = {
      apiUrl: "https://unicode-api.luxass.dev/api",
      unicodeProxyUrl: "https://unicode-proxy.ucdjs.dev",
      concurrency: 5,
      localPath: true,
    };

    const store = createUCDStore(options);

    expect(store.options).toEqual(options);
  });

  it("should work with empty options object", () => {
    const options: UCDStoreOptions = {};
    const store = createUCDStore(options);

    expect(store).toBeInstanceOf(UCDStore);
    expect(store.options).not.toEqual({});
    expect(store.options).toEqual(DEFAULT_STORE_OPTIONS);
  });

  it("should work with partial options", () => {
    const options: UCDStoreOptions = {
      apiUrl: "https://unicode-api.luxass.dev/api",
      concurrency: 10,
    };

    const store = createUCDStore(options);

    expect(store.options).toEqual({
      ...DEFAULT_STORE_OPTIONS,
      apiUrl: "https://unicode-api.luxass.dev/api",
      concurrency: 10,
    });
  });

  it("should work with only apiUrl option", () => {
    const options: UCDStoreOptions = {
      apiUrl: "https://unicode-api.luxass.dev/v2",
    };

    const store = createUCDStore(options);

    expect(store.options.apiUrl).toBe("https://unicode-api.luxass.dev/v2");
  });

  it("should work with only unicodeProxyUrl option", () => {
    const options: UCDStoreOptions = {
      unicodeProxyUrl: "https://unicode-proxy-v2.ucdjs.dev",
    };

    const store = createUCDStore(options);

    expect(store.options.unicodeProxyUrl).toBe("https://unicode-proxy-v2.ucdjs.dev");
  });

  it("should work with only concurrency option", () => {
    const options: UCDStoreOptions = {
      concurrency: 1,
    };

    const store = createUCDStore(options);

    expect(store.options.concurrency).toBe(1);
  });

  it("should work with only localPath option set to true", () => {
    const options: UCDStoreOptions = {
      localPath: true,
    };

    const store = createUCDStore(options);

    expect(store.options.localPath).toBe(true);
  });

  it("should work with only localPath option set to false", () => {
    const options: UCDStoreOptions = {
      localPath: false,
    };

    const store = createUCDStore(options);

    expect(store.options.localPath).toBe(false);
  });

  it("should handle extreme concurrency values", () => {
    const options: UCDStoreOptions = {
      concurrency: 0,
    };

    const store = createUCDStore(options);

    expect(store.options.concurrency).toBe(0);
  });

  it("should handle all options with maximum values", () => {
    const options: UCDStoreOptions = {
      apiUrl: "https://unicode-api.luxass.dev/api/v1/unicode/data/endpoint",
      unicodeProxyUrl: "https://unicode-proxy.ucdjs.dev/proxy/unicode",
      concurrency: Number.MAX_SAFE_INTEGER,
      localPath: true,
    };

    const store = createUCDStore(options);

    expect(store.options).toEqual(options);
  });

  it("should create multiple independent store instances", () => {
    const options1: UCDStoreOptions = { concurrency: 1 };
    const options2: UCDStoreOptions = { concurrency: 2 };

    const store1 = createUCDStore(options1);
    const store2 = createUCDStore(options2);

    expect(store1).not.toBe(store2);
    expect(store1.options.concurrency).toBe(1);
    expect(store2.options.concurrency).toBe(2);
  });

  it("should preserve object references in options", () => {
    const options: UCDStoreOptions = {
      apiUrl: "https://luxass.com",
    };

    const store = createUCDStore(options);

    expect(store.options).toStrictEqual({
      ...DEFAULT_STORE_OPTIONS,
      ...options,
    });
  });

  describe("edge cases", () => {
    it("should handle undefined values in options", () => {
      const options: UCDStoreOptions = {
        apiUrl: undefined,
        unicodeProxyUrl: undefined,
        concurrency: undefined,
        localPath: undefined,
      };

      const store = createUCDStore(options);

      expect(store.options).toEqual(DEFAULT_STORE_OPTIONS);
    });

    it("should handle empty strings", () => {
      const options: UCDStoreOptions = {
        apiUrl: "",
        unicodeProxyUrl: "",
      };

      const store = createUCDStore(options);

      expect(store.options.apiUrl).toBe("");
      expect(store.options.unicodeProxyUrl).toBe("");
    });

    it("should handle negative concurrency", () => {
      const options: UCDStoreOptions = {
        concurrency: -1,
      };

      const store = createUCDStore(options);

      expect(store.options.concurrency).toBe(-1);
    });
  });
});
