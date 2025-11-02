import type {
  FileSystemBridge,
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

    let operations: FileSystemBridgeOperations;
    try {
      operations = fsBridge.setup({
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
    const optionalCapabilities = inferOptionalCapabilitiesFromOperations(operations);

    return {
      meta: fsBridge.meta,
      optionalCapabilities,
      hook: hooks.hook.bind(hooks),

      // required operations
      read: createOperationWrapper("read", operations.read, hooks, operations),
      exists: createOperationWrapper("exists", operations.exists, hooks, operations),
      listdir: createOperationWrapper("listdir", operations.listdir, hooks, operations),

      // optional operations
      write: createOperationWrapper("write", operations.write, hooks, operations),
      mkdir: createOperationWrapper("mkdir", operations.mkdir, hooks, operations),
      rm: createOperationWrapper("rm", operations.rm, hooks, operations),
    };
  };
}

/**
 * @internal
 */
function createOperationWrapper<T extends keyof FileSystemBridgeOperations>(
  operationName: T,
  operation: FileSystemBridgeOperations[T] | undefined,
  hooks: HookableCore<FileSystemBridgeHooks>,
  operationsContext: FileSystemBridgeOperations,
): any {
  // If operation doesn't exist, return function that throws
  if (operation == null || typeof operation !== "function") {
    return (...args: unknown[]) => {
      debug?.("Attempted to call unsupported operation", { operation: operationName });
      const error = new BridgeUnsupportedOperation(operationName as OptionalCapabilityKey);

      // Call error hook for unsupported operations
      hooks.callHook("error", {
        method: operationName,
        path: args[0] as string,
        error,
        args,
      });

      throw error;
    };
  }

  // Return wrapped operation with hooks
  return (...args: unknown[]) => {
    try {
      const beforePayload = getPayloadForHook(operationName, "before", args);
      hooks.callHook(`${operationName}:before` as HookKey, beforePayload);

      // Call with the original operations context, to preserve "this"
      const result = (operation as any).apply(operationsContext, args);

      // Check if result is a promise
      if (result && typeof (result as PromiseLike<unknown>)?.then === "function") {
        if (!("catch" in (result as Promise<unknown>))) {
          throw new BridgeGenericError(
            `The promise returned by '${operationName}' operation does not support .catch()`,
          );
        }

        return (result as Promise<unknown>)
          .then((res) => {
            const afterPayload = getPayloadForHook(operationName, "after", args, res);
            hooks.callHook(`${operationName}:after` as HookKey, afterPayload);
            return res;
          })
          .catch((err: unknown) => handleError(operationName, args, err, hooks));
      }

      // Synchronous result
      const afterPayload = getPayloadForHook(operationName, "after", args, result);
      hooks.callHook(`${operationName}:after` as HookKey, afterPayload);
      return result;
    } catch (err: unknown) {
      return handleError(operationName, args, err, hooks);
    }
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

/**
 * @internal
 */
function handleError(
  operation: PropertyKey,
  args: unknown[],
  err: unknown,
  hooks: HookableCore<FileSystemBridgeHooks>,
): never {
  // Ensure that we always call the "error" hook with Error instances
  if (err instanceof Error) {
    hooks.callHook("error", {
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

  // If the error is not an Error instance, wrap it
  if (!(err instanceof Error)) {
    debug?.("Non-Error thrown in bridge operation", {
      operation: String(operation),
      error: String(err),
    });

    throw new BridgeGenericError(
      `Non-Error thrown in '${String(operation)}' operation: ${String(err)}`,
    );
  }

  // wrap unexpected errors in BridgeGenericError
  debug?.("Unexpected error in bridge operation", {
    operation: String(operation),
    error: err.message,
  });

  throw new BridgeGenericError(
    `Unexpected error in '${String(operation)}' operation: ${err.message}`,
    err,
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
