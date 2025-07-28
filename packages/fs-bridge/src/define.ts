import type {
  FileSystemBridge,
  FileSystemBridgeCapabilities,
  FileSystemBridgeObject,
  FileSystemBridgeOperationsWithSymbol,
} from "./types";
import { z } from "zod";
import { __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ } from "./internal";

const DEFAULT_SUPPORTED_CAPABILITIES: FileSystemBridgeCapabilities = {
  exists: true,
  read: true,
  write: true,
  listdir: true,
  mkdir: true,
  rm: true,
};

export function defineFileSystemBridge<
  TOptionsSchema extends z.ZodType,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(
  fsBridge: FileSystemBridgeObject<TOptionsSchema, TState>,
): FileSystemBridge<TOptionsSchema> {
  return (...args) => {
    const parsedOptions = (fsBridge.optionsSchema ?? z.never().optional()).safeParse(args[0]);

    if (!parsedOptions.success) {
      throw new Error(
        `Invalid options provided to file system bridge: ${parsedOptions.error.message}`,
      );
    }

    const options = parsedOptions.data as z.output<TOptionsSchema>;

    const { capabilities = DEFAULT_SUPPORTED_CAPABILITIES, state } = fsBridge;

    const bridge = fsBridge.setup({
      options,
      state: state ?? {} as TState,
      capabilities,
    });

    return Object.assign(bridge, {
      [__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__]: capabilities,
    }) satisfies FileSystemBridgeOperationsWithSymbol;
  };
}
