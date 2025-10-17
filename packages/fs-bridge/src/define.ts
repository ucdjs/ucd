import type {
  FileSystemBridgeFactory,
  FileSystemBridgeObject,
  HasOptionalCapabilityMap,
  OptionalCapabilityKey,
  OptionalFileSystemBridgeOperations,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
import { z } from "zod";
import {
  BridgeBaseError,
  BridgeGenericError,
  BridgeSetupError,
  BridgeUnsupportedOperation,
} from "./errors";

const debug = createDebugger("ucdjs:fs-bridge:define");

export function defineFileSystemBridge<
  TOptionsSchema extends z.ZodType = z.ZodNever,
  TState extends Record<string, unknown> = Record<string, unknown>,
>(
  fsBridge: FileSystemBridgeObject<TOptionsSchema, TState>,
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

    let bridge = null;
    try {
      bridge = fsBridge.setup({
        options,
        state: (state ?? {}) as TState,
        resolveSafePath,
      });
    } catch (err) {
      debug?.("Failed to setup file system bridge", { error: err instanceof Error ? err.message : String(err) });
      throw new BridgeSetupError(
        "Failed to setup file system bridge",
        err instanceof Error ? err : undefined,
      );
    }

    const optionalCapabilities = inferOptionalCapabilitiesFromOperations(bridge);

    const proxiedBridge = new Proxy(bridge, {
      get(target, property) {
        const val = target[property as keyof typeof target];

        // if it's an operation method and not implemented, throw
        if (typeof property === "string" && property in optionalCapabilities) {
          if (val == null || typeof val !== "function") {
            return () => {
              debug?.("Attempted to call unsupported operation", { operation: property });
              throw new BridgeUnsupportedOperation(property as OptionalCapabilityKey);
            };
          }

          const originalMethod = val as (...args: unknown[]) => unknown;

          if (typeof originalMethod === "function") {
            return (...args: unknown[]) => {
              try {
                const result = originalMethod.apply(target, args);

                // check if result is a promise
                if (result && typeof (result as PromiseLike<unknown>)?.then === "function") {
                  if (!("catch" in (result as Promise<unknown>))) {
                    throw new BridgeGenericError(
                      `The promise returned by '${String(property)}' operation does not support .catch()`,
                    );
                  }

                  return (result as Promise<unknown>).catch((err: unknown) => handleError(property, err));
                }

                // sync result, return as-is
                return result;
              } catch (error: unknown) {
                return handleError(property, error);
              }
            };
          }
        }

        return val;
      },
    });

    return Object.assign(proxiedBridge, {
      name: fsBridge.name,
      description: fsBridge.description,
      optionalCapabilities,
    });
  };
}

/**
 * @internal
 */
function inferOptionalCapabilitiesFromOperations(ops: OptionalFileSystemBridgeOperations): HasOptionalCapabilityMap {
  return {
    write: "write" in ops && typeof ops.write === "function",
    mkdir: "mkdir" in ops && typeof ops.mkdir === "function",
    rm: "rm" in ops && typeof ops.rm === "function",
  };
}

function handleError(operation: PropertyKey, err: unknown): never {
  // re-throw custom bridge errors directly
  if (err instanceof BridgeBaseError) {
    throw err;
  }

  if (err instanceof PathUtilsBaseError) {
    throw err;
  }

  // wrap unexpected errors in BridgeGenericError
  debug?.("Unexpected error in bridge operation", {
    operation: String(operation),
    error: err instanceof Error ? err.message : String(err),
  });
  throw new BridgeGenericError(
    `Unexpected error in '${String(operation)}' operation: ${err instanceof Error ? err.message : String(err)}`,
    err instanceof Error ? err : undefined,
  );
}
