import { join } from "pathe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getUcdConfigDir, getUcdConfigPath, getXdgConfigDir } from "../src/config";

const ENV_KEYS = [
  "XDG_CONFIG_HOME",
  "HOME",
  "HOMEDRIVE",
  "HOMEPATH",
  "USERPROFILE",
] as const;

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    vi.stubEnv(key, undefined);
  }

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      vi.stubEnv(key, value);
    }
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("config", () => {
  it("should return XDG_CONFIG_HOME when it is set", () => {
    setEnv({
      XDG_CONFIG_HOME: "/tmp/xdg",
      HOME: "/Users/tester",
      USERPROFILE: "/Users/profile",
    });

    expect(getXdgConfigDir()).toBe("/tmp/xdg");
  });

  it("should fall back to HOME/.config when XDG_CONFIG_HOME is missing", () => {
    setEnv({
      HOME: "/Users/tester",
    });

    expect(getXdgConfigDir()).toBe(join("/Users/tester", ".config"));
  });

  it("should fall back to HOMEDRIVE and HOMEPATH when HOME is missing", () => {
    setEnv({
      HOMEDRIVE: "C:",
      HOMEPATH: "Users/tester",
    });

    expect(getXdgConfigDir()).toBe(join("C:", "Users/tester", ".config"));
  });

  it("should fall back to USERPROFILE when HOME and HOMEDRIVE/HOMEPATH are missing", () => {
    setEnv({
      USERPROFILE: "/Users/profile",
    });

    expect(getXdgConfigDir()).toBe(join("/Users/profile", ".config"));
  });

  it("should throw when no home directory variables are available", () => {
    setEnv({});

    expect(() => getXdgConfigDir()).toThrow("Could not determine home directory");
  });

  it("should build the UCD config directory from the XDG config directory", () => {
    setEnv({
      XDG_CONFIG_HOME: "/tmp/xdg",
    });

    expect(getUcdConfigDir()).toBe(join("/tmp/xdg", "ucd"));
  });

  it("should append extra segments to the UCD config path", () => {
    setEnv({
      XDG_CONFIG_HOME: "/tmp/xdg",
    });

    expect(getUcdConfigPath("profiles", "default.json")).toBe(
      join("/tmp/xdg", "ucd", "profiles", "default.json"),
    );
  });
});
