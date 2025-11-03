import type {
  FileSystemBridgeFactory,
  FileSystemBridgeHooks,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
  HasOptionalCapabilityMap,
  HookKey,
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
import { detectBridgeRuntimeMode, getPayloadForHook } from "./utils";

const debug = createDebugger("ucdjs:fs-bridge:define");

/**
 * Defines a file system bridge that provides a unified interface for file operations.
 *
 * The bridge automatically detects whether it should operate in async or sync mode by inspecting
 * the required operations (`read`, `exists`, `listdir`). This detection affects how unsupported
 * operations behave:
 *
 * - **Async Mode**: If ANY required operation is an `async` function, the bridge operates in async mode.
 *   Unsupported operations will return a rejected Promise.
 * - **Sync Mode**: If ALL required operations are synchronous, the bridge operates in sync mode.
 *   Unsupported operations will throw synchronously.
 *
 * This ensures a consistent API within each bridge: async bridges are fully awaitable,
 * while sync bridges have zero async overhead.
 *
 * @template TOptionsSchema - Zod schema for bridge options
 * @template TState - State object type for the bridge
 * @param {FileSystemBridgeObject<TOptionsSchema, TState>} fsBridge - Bridge definition object
 * @returns {FileSystemBridgeFactory<TOptionsSchema>} Factory function that creates bridge instances
 *
 * @example
 * ```ts
 * // Sync Bridge (e.g., memory bridge)
 * const syncBridge = defineFileSystemBridge({
 *   meta: { name: "Sync Bridge" },
 *   setup() {
 *     const store = new Map();
 *     return {
 *       read: (path) => store.get(path),   // Sync
 *       exists: (path) => store.has(path), // Sync
 *       listdir: (path) => [],             // Sync
 *     };
 *   }
 * })();
 *
 * // Unsupported operations throw synchronously
 * try {
 *   syncBridge.write?.("file.txt", "content");
 * } catch (error) {
 *   // Catches synchronous throw
 * }
 * ```
 *
 * @example
 * ```ts
 * // Async Bridge (e.g., HTTP/Node bridge)
 * const asyncBridge = defineFileSystemBridge({
 *   meta: { name: "Async Bridge" },
 *   setup() {
 *     return {
 *       read: async (path) => fetchContent(path),  // Async
 *       exists: async (path) => checkExists(path), // Async
 *       listdir: async (path) => fetchList(path),  // Async
 *     };
 *   }
 * })();
 *
 * // Unsupported operations return rejected Promise
 * try {
 *   await asyncBridge.write?.("file.txt", "content");
 * } catch (error) {
 *   // Catches async rejection
 * }
 * ```
 */
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
    const isAsyncMode = detectBridgeRuntimeMode(operations);

    const baseWrapperOptions = {
      hooks,
      operations,
      isAsyncMode,
    } satisfies OperationWrapperOptions;

    return {
      meta: {
        ...fsBridge.meta,
        isAsyncMode,
      },
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
  };
}

interface OperationWrapperOptions {
  hooks: HookableCore<FileSystemBridgeHooks>;
  operations: FileSystemBridgeOperations;
  isAsyncMode: boolean;
}

/**
 * @internal
 */
function createOperationWrapper<T extends keyof FileSystemBridgeOperations>(operationName: T, {
  hooks,
  operations,
  isAsyncMode,
}: OperationWrapperOptions) {
  const operation = operations[operationName];

  // If operation doesn't exist, return function that throws/rejects based on bridge mode
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

      // For async bridges, return rejected Promise to maintain consistent async API
      // For sync bridges, throw synchronously for zero overhead
      if (isAsyncMode) {
        return Promise.reject(error);
      }

      throw error;
    };
  }

  return (...args: unknown[]) => {
    try {
      const beforePayload = getPayloadForHook(operationName, "before", args);
      const res = hooks.callHook(`${operationName}:before` as HookKey, beforePayload);
      if (res instanceof Promise) {
        return res.then((err) => {
          throw err;
        });
      }

      // Call with the original operations context, to preserve "this"
      const result = (operation as any).apply(operations, args);

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
