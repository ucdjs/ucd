import type { Mock } from "vitest";
import { promiseRetry } from "@luxass/utils";
import { LocalUCDStore } from "@ucdjs/ucd-store";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@luxass/utils", () => ({
  promiseRetry: vi.fn(),
}));

const mockPromiseRetry = promiseRetry as Mock;

// eslint-disable-next-line test/prefer-lowercase-title
describe("Local UCD Store", () => {
  let store: LocalUCDStore;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPromiseRetry.mockImplementation(async (fn: () => Promise<any>) => {
      return fn();
    });

    store = new LocalUCDStore();
  });

  it("should initialize with default options", () => {
    expect(store.baseUrl).toBeDefined();
    expect(store.proxyUrl).toBeDefined();
  });

  it("should initialize with custom options", () => {
    const customOptions = {
      baseUrl: "https://luxass.dev",
      proxyUrl: "https://proxy.luxass.dev",
      filters: ["*.json"],
    };

    const customStore = new LocalUCDStore(customOptions);

    expect(customStore.baseUrl).toBe("https://luxass.dev");
    expect(customStore.proxyUrl).toBe("https://proxy.luxass.dev");
  });
});
