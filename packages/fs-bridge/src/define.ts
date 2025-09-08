import type {
  FileSystemBridgeCapabilities,
  FileSystemBridgeCapabilityKey,
  FileSystemBridgeFactory,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
} from "./types";
import { resolveSafePath } from "@ucdjs/path-utils";
import { z } from "zod";
import {
  BridgeBaseError,
  BridgeGenericError,
  BridgeSetupError,
  BridgeUnsupportedOperation,
} from "./errors";

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

    const { state } = fsBridge;

    let bridge = null;
    try {
      bridge = fsBridge.setup({
        options,
        state: (state ?? {}) as TState,
        resolveSafePath,
      });
    } catch (err) {
      throw new BridgeSetupError(
        "Failed to setup file system bridge",
        err instanceof Error ? err : undefined,
      );
    }

    const capabilities = inferCapabilitiesFromOperations(bridge);

    const proxiedBridge = new Proxy(bridge, {
      get(target, property) {
        const val = target[property as keyof typeof target];

        // if it's an operation method and not implemented, throw
        if (typeof property === "string" && property in capabilities) {
          if (val == null || typeof val !== "function") {
            return () => {
              throw new BridgeUnsupportedOperation(property as FileSystemBridgeCapabilityKey);
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
      capabilities,
    });
  };
}

/**
 * @internal
 */
function inferCapabilitiesFromOperations(ops: Partial<FileSystemBridgeOperations>): FileSystemBridgeCapabilities {
  return {
    read: "read" in ops && typeof ops.read === "function",
    write: "write" in ops && typeof ops.write === "function",
    listdir: "listdir" in ops && typeof ops.listdir === "function",
    exists: "exists" in ops && typeof ops.exists === "function",
    mkdir: "mkdir" in ops && typeof ops.mkdir === "function",
    rm: "rm" in ops && typeof ops.rm === "function",
  };
}

function handleError(operation: PropertyKey, error: unknown): never {
  // re-throw custom bridge errors directly
  if (error instanceof BridgeBaseError) {
    throw error;
  }

  // wrap unexpected errors in BridgeGenericError
  throw new BridgeGenericError(
    `Unexpected error in '${String(operation)}' operation: ${error instanceof Error ? error.message : String(error)}`,
    error instanceof Error ? error : undefined,
  );
}
