import type {
  FileSystemBridgeFactory,
  FileSystemBridgeHooks,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  HasOptionalCapabilityMap,
  OptionalCapabilityKey,
  OptionalFileSystemBridgeOperations,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
import { createHooks } from "hooxs";
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

    const hooks = createHooks<FileSystemBridgeHooks>();

    const optionalCapabilities = inferOptionalCapabilitiesFromOperations(bridge);
    const bridgeOperations: (keyof FileSystemBridgeOperations)[] = [
      "read",
      "write",
      "listdir",
      "exists",
      "mkdir",
      "rm",
    ];

    const newBridge = {
      ...bridge,
      optionalCapabilities,
      meta: fsBridge.meta,
      on: hooks.register.bind(hooks),
    };

    const bridgeOperationsProxy = new Proxy(newBridge, {
      get(target, property) {
        const val = target[property as keyof typeof target];

        // if it's an operation method and not implemented, throw
        if (typeof property === "string" && bridgeOperations.includes(property as keyof FileSystemBridgeOperations)) {
          if (val == null || typeof val !== "function") {
            return (...args: unknown[]) => {
              debug?.("Attempted to call unsupported operation", { operation: property });
              const error = new BridgeUnsupportedOperation(property as
                OptionalCapabilityKey);

              // call error hook for unsupported operations
              hooks.call("error", {
                method: property as keyof FileSystemBridgeOperations,
                path: args[0] as string,
                error,
                args,
              });

              throw error;
            };
          }

          const originalMethod = val as (...args: unknown[]) => unknown;

          if (typeof originalMethod === "function") {
            return (...args: unknown[]) => {
              try {
                const beforePayload = getPayloadForHook(property, "before", args);
                hooks.call(`${property}:before` as keyof FileSystemBridgeHooks, beforePayload);

                const result = originalMethod.apply(target, args);

                // check if result is a promise
                if (result && typeof (result as PromiseLike<unknown>)?.then === "function") {
                  if (!("catch" in (result as Promise<unknown>))) {
                    throw new BridgeGenericError(
                      `The promise returned by '${String(property)}' operation does not support .catch()`,
                    );
                  }

                  return (result as Promise<unknown>)
                    .then((res) => {
                      const afterPayload = getPayloadForHook(property, "after", args, res);
                      hooks.call(`${property}:after` as keyof FileSystemBridgeHooks, afterPayload);
                      return res;
                    })
                    .catch((err: unknown) => handleError(property, args, err, hooks));
                }

                const afterPayload = getPayloadForHook(property, "after", args, result);
                hooks.call(`${property}:after` as keyof FileSystemBridgeHooks, afterPayload);
                return result;
              } catch (err: unknown) {
                return handleError(property, args, err, hooks);
              }
            };
          }
        }

        return val;
      },
    });

    return bridgeOperationsProxy;
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

function handleError(
  operation: PropertyKey,
  args: unknown[],
  err: unknown,
  hooks: ReturnType<typeof createHooks<FileSystemBridgeHooks>>,
): never {
  // Ensure that we always call the "error" hook with Error instances
  if (err instanceof Error) {
    hooks.call("error", {
      method: operation as keyof FileSystemBridgeOperations,
      path: args[0] as string,
      error: err,
      args,
    });
  }

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

function getPayloadForHook(property: string, phase: "before" | "after", args: unknown[], result?: unknown): any {
  switch (property) {
    case "read": {
      if (phase === "before") {
        return { path: args[0] as string };
      } else {
        return { path: args[0] as string, content: result as string };
      }
    }

    case "write": {
      if (phase === "before") {
        return { path: args[0] as string, content: args[1] as string };
      } else {
        return { path: args[0] as string };
      }
    }

    case "listdir": {
      if (phase === "before") {
        return { path: args[0] as string, recursive: (args[1] as boolean | undefined) ?? false };
      } else {
        return { path: args[0] as string, recursive: (args[1] as boolean | undefined) ?? false, entries: result as unknown[] };
      }
    }

    case "exists": {
      if (phase === "before") {
        return { path: args[0] as string };
      } else {
        return { path: args[0] as string, exists: result as boolean };
      }
    }

    case "mkdir": {
      return { path: args[0] as string };
    }

    case "rm": {
      return { path: args[0] as string, ...(args[1] as FileSystemBridgeRmOptions) };
    }

    default:
      return {};
  }
}
