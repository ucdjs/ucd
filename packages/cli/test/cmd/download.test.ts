/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as cliUtils from "../../src/cli-utils";
import { runDownload } from "../../src/cmd/download";

vi.mock("../../src/cli-utils", async () => {
  const actual = await vi.importActual("../../src/cli-utils");
  return {
    ...actual,
    printHelp: vi.fn(),
  };
});

const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

describe("download command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    console.log = vi.fn();
    console.info = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
  });

  describe("command validation", () => {
    it("should print help when help flag is provided", async () => {
      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          help: true,
        },
      });

      expect(cliUtils.printHelp).toHaveBeenCalled();
    });

    it("should print help when h flag is provided", async () => {
      await runDownload({
        versions: ["16.0.0"],
        flags: {
          _: ["16.0.0"],
          h: true,
        },
      });

      expect(cliUtils.printHelp).toHaveBeenCalled();
    });
  });
});
