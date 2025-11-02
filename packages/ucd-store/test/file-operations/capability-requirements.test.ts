import { mockStoreApi } from "#test-utils/mock-store";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { UNICODE_VERSION_METADATA } from "@unicode-utils/core";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { UCDStore } from "../../src/store";

describe("capability requirements", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": UNICODE_VERSION_METADATA,
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should work correctly when bridge has required capabilities", async () => {
    const readSpy = vi.fn().mockResolvedValueOnce(JSON.stringify({}));
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    const existsSpy = vi.fn().mockResolvedValue(true);
    const mkdirSpy = vi.fn().mockResolvedValue(undefined);
    const listdirSpy = vi.fn().mockResolvedValue([
      {
        name: "test.txt",
        path: "test.txt",
        type: "file" as const,
      },
    ]);

    const bridgeWithCapabilities = defineFileSystemBridge({
      meta: {
        name: "Full Capabilities Bridge",
        description: "A mock file system bridge with all required capabilities",
      },
      setup: () => ({
        read: readSpy,
        write: writeSpy,
        exists: existsSpy,
        listdir: listdirSpy,
        mkdir: mkdirSpy,
      }),
    });

    const store = new UCDStore({
      fs: bridgeWithCapabilities(),
      versions: ["15.0.0"],
    });

    await store.init();

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(existsSpy).toHaveBeenCalledTimes(1);

    const [fileTreeData, fileTreeError] = await store.getFileTree("15.0.0");
    assert(fileTreeError === null, "Expected getFileTree to succeed");
    expect(fileTreeData).toEqual([
      {
        name: "test.txt",
        path: "test.txt",
        type: "file",
      },
    ]);

    const [filePathsData, filePathsError] = await store.getFilePaths("15.0.0");
    assert(filePathsError === null, "Expected getFilePaths to succeed");
    expect(filePathsData).toEqual(["test.txt"]);

    expect(listdirSpy).toHaveBeenCalledTimes(2);
    expect(readSpy).not.toHaveBeenCalledAfter(listdirSpy);
    expect(existsSpy).not.toHaveBeenCalledAfter(listdirSpy);
    expect(writeSpy).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
  });
});
