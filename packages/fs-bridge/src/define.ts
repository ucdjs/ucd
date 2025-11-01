import type {
  FileSystemBridgeFactory,
  FileSystemBridgeHooks,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
  HasOptionalCapabilityMap,
  HookKey,
  HookPayload,
  HookPayloadMap,
  OptionalCapabilityKey,
  OptionalFileSystemBridgeOperations,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { PathUtilsBaseError, resolveSafePath } from "@ucdjs/path-utils";
import { HookableCore } from "hookable";
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

    const hooks = new HookableCore<FileSystemBridgeHooks>();

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
      hook: hooks.hook.bind(hooks),
    };

    const bridgeOperationsProxy = new Proxy(newBridge, {
      get(target, property) {
        const val = target[property as keyof typeof target];

        // if it's an operation method and not implemented, throw
        if (typeof property === "string" && bridgeOperations.includes(property as keyof FileSystemBridgeOperations)) {
          if (val == null || typeof val !== "function") {
            return async (...args: unknown[]) => {
              debug?.("Attempted to call unsupported operation", { operation: property });
              const error = new BridgeUnsupportedOperation(property as OptionalCapabilityKey);

              // call error hook for unsupported operations
              await hooks.callHook("error", {
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
            return async (...args: unknown[]) => {
              try {
                const beforePayload = getPayloadForHook(property, "before", args);

                await hooks.callHook(`${property}:before` as HookKey, beforePayload);

                const result = originalMethod.apply(target, args);

                // check if result is a promise
                if (result && typeof (result as PromiseLike<unknown>)?.then === "function") {
                  if (!("catch" in (result as Promise<unknown>))) {
                    throw new BridgeGenericError(
                      `The promise returned by '${String(property)}' operation does not support .catch()`,
                    );
                  }

                  return (result as Promise<unknown>)
                    .then(async (res) => {
                      const afterPayload = getPayloadForHook(property, "after", args, res);
                      await hooks.callHook(`${property}:after` as HookKey, afterPayload);
                      return res;
                    })
                    .catch((err: unknown) => handleError(property, args, err, hooks));
                }

                const afterPayload = getPayloadForHook(property, "after", args, result);
                await hooks.callHook(`${property}:after` as HookKey, afterPayload);
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

async function handleError(
  operation: PropertyKey,
  args: unknown[],
  err: unknown,
  hooks: HookableCore<FileSystemBridgeHooks>,
): Promise<never> {
  // Ensure that we always call the "error" hook with Error instances
  if (err instanceof Error) {
    await hooks.callHook("error", {
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

function getPayloadForHook(
  property: string,
  phase: "before" | "after",
  args: unknown[],
  result?: unknown,
): HookPayload {
  switch (property) {
    case "read": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["read:before"];
      } else {
        return {
          path: args[0] as string,
          content: result as string,
        } satisfies HookPayloadMap["read:after"];
      }
    }

    case "write": {
      if (phase === "before") {
        return {
          path: args[0] as string,
          content: args[1] as string,
          encoding: (args[2] as BufferEncoding | undefined),
        } satisfies HookPayloadMap["write:before"];
      } else {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["write:after"];
      }
    }

    case "listdir": {
      if (phase === "before") {
        return {
          path: args[0] as string,
          recursive: (args[1] as boolean | undefined) ?? false,
        } satisfies HookPayloadMap["listdir:before"];
      } else {
        return {
          path: args[0] as string,
          recursive: (args[1] as boolean | undefined) ?? false,
          entries: result as FSEntry[],
        } satisfies HookPayloadMap["listdir:after"];
      }
    }

    case "exists": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["exists:before"];
      } else {
        return {
          path: args[0] as string,
          exists: result as boolean,
        } satisfies HookPayloadMap["exists:after"];
      }
    }

    case "mkdir": {
      return {
        path: args[0] as string,
      } satisfies (HookPayloadMap["mkdir:before"] & HookPayloadMap["mkdir:after"]);
    }

    case "rm": {
      return {
        path: args[0] as string,
        ...(args[1] as FileSystemBridgeRmOptions),
      } satisfies (HookPayloadMap["rm:before"] & HookPayloadMap["rm:after"]);
    }

    default:
      throw new BridgeGenericError(
        `Failed to construct hook payload for '${property}:${phase}' hook`,
      );
  }
}
