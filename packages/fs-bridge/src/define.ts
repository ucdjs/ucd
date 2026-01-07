import type {
  FileSystemBridge,
  FileSystemBridgeFactory,
  FileSystemBridgeHooks,
  FileSystemBridgeObject,
} from "./types";
import type { OperationWrapperOptions } from "./utils";
import { createDebugger } from "@ucdjs-internal/shared";
import { resolveSafePath } from "@ucdjs/path-utils";
import { HookableCore } from "hookable";
import { z } from "zod";
import {
  BridgeSetupError,
} from "./errors";
import { createOperationWrapper, inferOptionalCapabilitiesFromOperations } from "./utils";

const debug = createDebugger("ucdjs:fs-bridge:define");

export function defineFileSystemBridge<
  TOptionsSchema extends z.ZodType = z.ZodNever,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(
  fsBridge: FileSystemBridgeObject<TOptionsSchema, TState> & { symbol?: symbol },
): FileSystemBridgeFactory<TOptionsSchema> {
  return (...args) => {
    const parsedOptions = (fsBridge.optionsSchema ?? z.never().optional()).safeParse(args[0]);

    if (!parsedOptions.success) {
      debug?.("Invalid options provided to file system bridge", { error: parsedOptions.error.message });
      throw new Error(
        `Invalid options provided to file system bridge: ${parsedOptions.error.message}`,
      );
    }

    const options = parsedOptions.data as z.output<TOptionsSchema>;

    const { state } = fsBridge;

    let bridgeOperations = null;
    try {
      bridgeOperations = fsBridge.setup({
        options,
        state: (structuredClone(state) ?? {}) as TState,
        resolveSafePath,
      });
    } catch (err) {
      debug?.("Failed to setup file system bridge", { error: err instanceof Error ? err.message : String(err) });
      throw new BridgeSetupError(
        "Failed to setup file system bridge",
        err instanceof Error ? err : undefined,
      );
    }

    const hooks = new HookableCore<FileSystemBridgeHooks>();

    const optionalCapabilities = inferOptionalCapabilitiesFromOperations(bridgeOperations);

    const baseWrapperOptions = {
      hooks,
      operations: bridgeOperations,
    } satisfies OperationWrapperOptions;

    const bridge: FileSystemBridge = {
      meta: fsBridge.meta,
      optionalCapabilities,
      hook: hooks.hook.bind(hooks),

      // required operations
      read: createOperationWrapper("read", baseWrapperOptions),
      exists: createOperationWrapper("exists", baseWrapperOptions),
      listdir: createOperationWrapper("listdir", baseWrapperOptions),

      // optional operations
      write: createOperationWrapper("write", baseWrapperOptions),
      mkdir: createOperationWrapper("mkdir", baseWrapperOptions),
      rm: createOperationWrapper("rm", baseWrapperOptions),
    };

    // Attach symbol if provided
    if (fsBridge.symbol) {
      (bridge as unknown as Record<symbol, boolean>)[fsBridge.symbol] = true;
    }

    return bridge;
  };
}
