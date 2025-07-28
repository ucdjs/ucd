import type {
  FileSystemBridge,
  FileSystemBridgeCapabilities,
  FileSystemBridgeObject,
  FileSystemBridgeOperationsWithSymbol,
} from "./types";
import { z } from "zod";

const DEFAULT_SUPPORTED_CAPABILITIES: FileSystemBridgeCapabilities = {
  exists: true,
  read: true,
  write: true,
  listdir: true,
  mkdir: true,
  rm: true,
};

/**
 * Internal debug symbol used to attach capability information to file system bridge instances.
 *
 * @internal
 * @remarks
 * This symbol is used internally by the fs-bridge package to store debugging information
 * about bridge capabilities. It should never be used by external code as it may change
 * or be removed without notice.
 *
 * @warning
 * The name explicitly indicates this is for internal use only. Using this symbol in
 * external code will likely break your application when the package is updated.
 *
 * @example
 * ```typescript
 * // DON'T DO THIS - Internal use only
 * const capabilities = bridge[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
 * ```
 */
export const __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__: unique symbol = Symbol.for("ucdjs.fs-bridge.debug");

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
