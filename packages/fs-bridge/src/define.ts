import type {
  FileSystemBridge,
  FileSystemBridgeCapabilities,
  FileSystemBridgeObject,
} from "./types";
import z from "zod";

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

    return fsBridge.setup({
      options,
      state: state ?? {} as TState,
      capabilities,
    });
  };
}
