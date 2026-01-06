import type { HookableCore } from "hookable";
import type {
  FileSystemBridgeHooks,
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
import { isMSWError } from "@luxass/msw-utils/runtime-guards";
import { createDebugger } from "@ucdjs-internal/shared";
import { PathUtilsBaseError } from "@ucdjs/path-utils";
import { BridgeGenericError, BridgeUnsupportedOperation } from "./errors";

const debug = createDebugger("ucdjs:fs-bridge:utils");

/**
 * @internal
 */
export function inferOptionalCapabilitiesFromOperations(ops: OptionalFileSystemBridgeOperations): HasOptionalCapabilityMap {
  return {
    write: "write" in ops && typeof ops.write === "function",
    mkdir: "mkdir" in ops && typeof ops.mkdir === "function",
    rm: "rm" in ops && typeof ops.rm === "function",
  };
}

/**
 * Constructs a hook payload object for a given file system bridge operation.
 *
 * This function normalizes arguments and results from different file system operations
 * into their corresponding hook payload structures. It supports both "before" and "after"
 * phases for operations that distinguish between them.
 *
 * @param {string} property - The name of the file system operation (e.g., "read", "write", "listdir", "exists", "mkdir", "rm")
 * @param {string} phase - The hook execution phase: "before" runs before the operation, "after" runs after
 * @param {unknown[]} args - The arguments passed to the original operation
 * @param {unknown} result - The result from the operation (only used for "after" phase hooks)
 * @returns A {@link HookPayload} object containing normalized data for the hook
 */
export function getPayloadForHook(
  property: string,
  phase: "before" | "after",
  args: unknown[],
  result?: unknown,
): HookPayload {
  debug?.(`Constructing hook payload for '${property}:${phase}'`);
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

export interface OperationWrapperOptions {
  hooks: HookableCore<FileSystemBridgeHooks>;
  operations: FileSystemBridgeOperations;
}

/**
 * @internal
 */
export function createOperationWrapper<T extends keyof FileSystemBridgeOperations>(operationName: T, {
  hooks,
  operations,
}: OperationWrapperOptions) {
  const operation = operations[operationName];

  // If operation doesn't exist, return function that throws/rejects based on bridge mode
  if (operation == null || typeof operation !== "function") {
    return async (...args: unknown[]) => {
      debug?.("Attempted to call unsupported operation", { operation: operationName });
      const error = new BridgeUnsupportedOperation(operationName as OptionalCapabilityKey);

      // Call error hook for unsupported operations
      await hooks.callHook("error", {
        method: operationName,
        path: args[0] as string,
        error,
        args,
      });

      throw error;
    };
  }

  return async (...args: unknown[]) => {
    try {
      const beforePayload = getPayloadForHook(operationName, "before", args);
      await hooks.callHook(`${operationName}:before` as HookKey, beforePayload);

      // Call with the original operations context, to preserve "this"
      const result = await (operation as any).apply(operations, args);

      const afterPayload = getPayloadForHook(operationName, "after", args, result);
      await hooks.callHook(`${operationName}:after` as HookKey, afterPayload);

      return result;
    } catch (err: unknown) {
      return handleError(operationName, args, err, hooks);
    }
  };
}

async function handleError(
  operation: PropertyKey,
  args: unknown[],
  err: unknown,
  hooks: HookableCore<FileSystemBridgeHooks>,
): Promise<never> {
  const normalizedError = (() => {
    if (err instanceof Error) {
      return err;
    }

    debug?.("Non-Error thrown in bridge operation", {
      operation: String(operation),
      error: String(err),
    });

    return new BridgeGenericError(
      `Non-Error thrown in '${String(operation)}' operation: ${String(err)}`,
      { cause: err },
    );
  })();

  // check if this is an MSW error
  if (isMSWError(normalizedError)) {
    debug?.("MSW error detected in bridge operation", {
      operation: String(operation),
      error: normalizedError.message,
    });

    throw normalizedError;
  }

  await hooks.callHook("error", {
    method: operation as keyof FileSystemBridgeOperations,
    path: args[0] as string,
    error: normalizedError,
    args,
  });

  if (normalizedError instanceof BridgeGenericError || normalizedError instanceof PathUtilsBaseError) {
    debug?.("Known error thrown in bridge operation", {
      operation: String(operation),
      error: normalizedError.message,
    });

    throw normalizedError;
  }

  // wrap unexpected errors in BridgeGenericError
  debug?.("Unexpected error in bridge operation", {
    operation: String(operation),
    error: normalizedError.message,
  });

  throw new BridgeGenericError(
    `Unexpected error in '${String(operation)}' operation: ${normalizedError.message}`,
    { cause: normalizedError },
  );
}
