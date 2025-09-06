import { describe, expect, it, vi } from "vitest";

describe("bing bong internal", () => {
  it("should log 'Bing Bong'", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { internal_bingbong } = await import("../src/index").then((m) => m);

    internal_bingbong();

    expect(consoleSpy).toHaveBeenCalledWith("Bing Bong");
    consoleSpy.mockRestore();
  });
});
