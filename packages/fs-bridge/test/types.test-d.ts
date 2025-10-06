import type { FileSystemBridgeFactory } from "../src/types";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { describe, expectTypeOf, it } from "vitest";
import z from "zod";

describe("defineFileSystemBridge", () => {
  it("should infer the correct types for options and state", () => {
    const MyBridge = defineFileSystemBridge({
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
      setup() {
        return {};
      },
    });

    expectTypeOf(SimpleBridge).toExtend<FileSystemBridgeFactory<z.ZodNever>>();
  });

  it("should work with no optionsSchema but with state", () => {
    const StateBridge = defineFileSystemBridge({
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
