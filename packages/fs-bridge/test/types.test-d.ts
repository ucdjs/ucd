import type { FileSystemBridgeFactory } from "../src/types";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { describe, expectTypeOf, it } from "vitest";
import z from "zod";

describe("defineFileSystemBridge", () => {
  it("should infer the correct types for options and state", () => {
    const MyBridge = defineFileSystemBridge({
      meta: {
        name: "My Bridge",
        description: "A test file system bridge",
      },
      optionsSchema: z.object({
        basePath: z.string(),
        recursive: z.boolean().optional(),
      }),
      state: {
        initialized: false,
      },
      setup({ options, state }) {
        expectTypeOf(options).toEqualTypeOf<{
          basePath: string;
          recursive?: boolean | undefined;
        }>();
        expectTypeOf(state).toEqualTypeOf<{
          initialized: boolean;
        }>();

        return {};
      },
    });

    expectTypeOf(MyBridge).toExtend<FileSystemBridgeFactory<z.ZodObject<{
      basePath: z.ZodString;
      recursive: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>();
  });

  it("should work with no optionsSchema and no state", () => {
    const SimpleBridge = defineFileSystemBridge({
      meta: {
        name: "Simple Bridge",
        description: "A simple file system bridge",
      },
      setup() {
        return {};
      },
    });

    expectTypeOf(SimpleBridge).toExtend<FileSystemBridgeFactory<z.ZodNever>>();
  });

  it("should work with no optionsSchema but with state", () => {
    const StateBridge = defineFileSystemBridge({
      meta: {
        name: "State Bridge",
        description: "A stateful file system bridge",
      },
      state: {
        count: 0,
      },
      setup({ state }) {
        expectTypeOf(state).toEqualTypeOf<{
          count: number;
        }>();
        return {};
      },
    });

    expectTypeOf(StateBridge).toExtend<FileSystemBridgeFactory<z.ZodNever>>();
  });
});
