import type { Arguments } from "yargs-parser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { parseFlags, resolveCommand, runCommand } from "../src/cli-utils";

const mockRunStore = vi.fn();

describe("resolveCommand", () => {
  it("should return 'version' when version flag is present", () => {
    const flags: Arguments = { _: [], version: true };
    expect(resolveCommand(flags)).toBe("version");
  });

  it("should return the command from the third positional argument if it is supported", () => {
    const flags: Arguments = { _: ["", "", "store"], version: false };
    expect(resolveCommand(flags)).toBe("store");
  });

  it("should return 'help' when the third positional argument is not a supported command", () => {
    const flags: Arguments = { _: ["", "", "unknown"], version: false };
    expect(resolveCommand(flags)).toBe("help");
  });

  it("should return 'help' when there is no third positional argument", () => {
    const flags: Arguments = { _: [], version: false };
    expect(resolveCommand(flags)).toBe("help");
  });
});

describe("parseFlags", () => {
  it("should parse boolean flags correctly", () => {
    const args = ["--force", "--help"];
    const flags = parseFlags(args);
    expect(flags.force).toBe(true);
    expect(flags.help).toBe(true);
  });

  it("should use default values when flags are not provided", () => {
    const flags = parseFlags([]);
    expect(flags.force).toBe(false);
  });

  it("should not parse positional arguments as numbers", () => {
    const args = ["123", "456"];
    const flags = parseFlags(args);
    expect(flags._).toEqual(["123", "456"]);
  });

  it("should allow overriding default values", () => {
    const args = [
      "--force",
    ];
    const flags = parseFlags(args);
    expect(flags.force).toBe(true);
  });
});

describe("runCommand", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should print help message for 'help' command", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    await runCommand("help", { _: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("A CLI for working with the Unicode Character Database (UCD)."),
    );
  });

  it("should print version for 'version' command", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    await runCommand("version", { _: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`v${pkg.version}`),
    );
  });

  it("should handle 'store' command", async () => {
    vi.mock("../src/cmd/store/root", () => ({
      runStoreRoot: mockRunStore,
    }));

    const flags = { _: ["", "", "store"], force: false };
    await runCommand("store", flags);

    expect(mockRunStore).toHaveBeenCalledWith("", {
      flags: expect.objectContaining({
        _: ["", "", "store"],
        force: false,
      }),
    });
  });

  it("should throw error for unknown command", async () => {
    // @ts-expect-error Testing invalid command
    await expect(runCommand("invalid", { _: [] })).rejects.toThrow(
      "Error running invalid -- no command found.",
    );
  });
});
