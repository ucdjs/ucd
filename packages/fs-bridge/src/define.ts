import type {
  FileSystemBridgeFactory,
  FileSystemBridgeObject,
} from "./types";
import { z } from "zod";

export function defineFileSystemBridge<
  TOptionsSchema extends z.ZodType,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(
  fsBridge: FileSystemBridgeObject<TOptionsSchema, TState>,
): FileSystemBridgeFactory<TOptionsSchema> {
  return (...args) => {
    const parsedOptions = (fsBridge.optionsSchema ?? z.never().optional()).safeParse(args[0]);

    if (!parsedOptions.success) {
      throw new Error(
        `Invalid options provided to file system bridge: ${parsedOptions.error.message}`,
      );
    }

    const options = parsedOptions.data as z.output<TOptionsSchema>;

    const { capabilities, state } = fsBridge;

    const bridge = fsBridge.setup({
      options,
      state: state ?? {} as TState,
      capabilities,
    });

    return Object.assign(bridge, {
      capabilities,
    });
  };
}
