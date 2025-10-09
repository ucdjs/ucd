import { describe, expect, it } from "vitest";
import { defineFileSystemBridge } from "../src/define";

describe("bridge metadata", () => {
  it("should attach metadata to bridge", () => {
    const TestBridge = defineFileSystemBridge({
      name: "Test Bridge",
      description: "A test file system bridge",
      metadata: {
        persistent: false,
      },
      setup() {
        return {};
      },
    });

    const bridge = TestBridge();

    expect(bridge.metadata).toBeDefined();
    expect(bridge.metadata?.persistent).toBe(false);
  });

  it("should support custom metadata", () => {
    const TestBridge = defineFileSystemBridge({
      name: "Test Bridge with Custom Metadata",
      description: "A test file system bridge with custom metadata",
      metadata: {
        persistent: true,

        // Custom Field
        customField: "customValue",
      },
      setup() {
        return {};
      },
    });

    const bridge = TestBridge();

    expect(bridge.metadata).toBeDefined();
    expect(bridge.metadata?.persistent).toBe(true);

    // Custom Field
    expect(bridge.metadata?.customField).toBe("customValue");
  });

  it("should infer capabilities independent of metadata", () => {
    const TestBridge = defineFileSystemBridge({
      name: "Test Bridge for Capabilities",
      description: "A test file system bridge for capabilities",
      metadata: {
        persistent: false,
      },
      setup() {
        return {
          async read(path) {
            return `content of ${path}`;
          },
          async write(_path, _content) {
          },
        };
      },
    });

    const bridge = TestBridge();

    // capabilities inferred from methods
    expect(bridge.capabilities.read).toBe(true);
    expect(bridge.capabilities.write).toBe(true);
    expect(bridge.capabilities.mkdir).toBe(false);

    // metadata independent
    expect(bridge.metadata?.persistent).toBe(false);
  });
});
