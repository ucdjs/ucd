import type { HookableCore } from "hookable";
import type {
  BackendEntry,
  BackendStat,
  BackendHooks,
  CopyOptions,
  FileSystemBackendFeature,
  FileSystemBackendMutableOperations,
  FileSystemBackendOperations,
  HookKey,
  HookPayload,
  HookPayloadMap,
  ListOptions,
  RemoveOptions,
} from "./types";
import { isMSWError } from "@luxass/msw-utils/runtime-guards";
import { createDebugger } from "@ucdjs-internal/shared";
import { PathUtilsBaseError } from "@ucdjs/path-utils";
import { BackendError, BackendUnsupportedOperation } from "./errors";

const debug = createDebugger("ucdjs:fs-backend:utils");
type BackendOperationMap = FileSystemBackendOperations & FileSystemBackendMutableOperations;

export function inferFeaturesFromOperations(
  ops: FileSystemBackendMutableOperations,
): ReadonlySet<FileSystemBackendFeature> {
  const features = new Set<FileSystemBackendFeature>();

  if (typeof ops.write === "function") {
    features.add("write");
  }
  if (typeof ops.mkdir === "function") {
    features.add("mkdir");
  }
  if (typeof ops.remove === "function") {
    features.add("remove");
  }
  if (typeof ops.copy === "function") {
    features.add("copy");
  }

  return features;
}

export function getPayloadForHook(
  operation: string,
  phase: "before" | "after",
  args: unknown[],
  result?: unknown,
): HookPayload {
  switch (operation) {
    case "read": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["read:before"];
      }

      return {
        path: args[0] as string,
        content: result as string,
      } satisfies HookPayloadMap["read:after"];
    }

    case "readBytes": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["readBytes:before"];
      }

      return {
        path: args[0] as string,
        data: result as Uint8Array,
      } satisfies HookPayloadMap["readBytes:after"];
    }

    case "list": {
      const options = (args[1] as ListOptions | undefined) ?? {};
      const recursive = options.recursive ?? false;

      if (phase === "before") {
        return {
          path: args[0] as string,
          recursive,
        } satisfies HookPayloadMap["list:before"];
      }

      return {
        path: args[0] as string,
        recursive,
        entries: result as BackendEntry[],
      } satisfies HookPayloadMap["list:after"];
    }

    case "exists": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["exists:before"];
      }

      return {
        path: args[0] as string,
        result: result as boolean,
      } satisfies HookPayloadMap["exists:after"];
    }

    case "stat": {
      if (phase === "before") {
        return {
          path: args[0] as string,
        } satisfies HookPayloadMap["stat:before"];
      }

      return {
        path: args[0] as string,
        stat: result as BackendStat,
      } satisfies HookPayloadMap["stat:after"];
    }

    case "write": {
      if (phase === "before") {
        return {
          path: args[0] as string,
          data: args[1] as string | Uint8Array,
        } satisfies HookPayloadMap["write:before"];
      }

      return {
        path: args[0] as string,
      } satisfies HookPayloadMap["write:after"];
    }

    case "mkdir": {
      return {
        path: args[0] as string,
      } satisfies (HookPayloadMap["mkdir:before"] & HookPayloadMap["mkdir:after"]);
    }

    case "remove": {
      return {
        path: args[0] as string,
        ...((args[1] as RemoveOptions | undefined) ?? {}),
      } satisfies (HookPayloadMap["remove:before"] & HookPayloadMap["remove:after"]);
    }

    case "copy": {
      return {
        sourcePath: args[0] as string,
        destinationPath: args[1] as string,
        ...((args[2] as CopyOptions | undefined) ?? {}),
      } satisfies (HookPayloadMap["copy:before"] & HookPayloadMap["copy:after"]);
    }

    default:
      throw new Error(`Unsupported hook payload for operation '${operation}'`);
  }
}

export interface OperationWrapperOptions {
  hooks: HookableCore<BackendHooks>;
  operations: BackendOperationMap;
}

async function callBackendHook(
  hooks: HookableCore<BackendHooks>,
  name: HookKey,
  payload: HookPayload,
): Promise<void> {
  await (hooks.callHook as (name: HookKey, payload: HookPayload) => Promise<void>)(name, payload);
}

export function createOperationWrapper<T extends keyof BackendOperationMap>(
  operationName: T,
  {
    hooks,
    operations,
  }: OperationWrapperOptions,
): NonNullable<BackendOperationMap[T]> {
  const operation = operations[operationName];

  if (operation == null || typeof operation !== "function") {
    const unsupportedOperation = async (...args: unknown[]) => {
      const error = new BackendUnsupportedOperation(operationName as FileSystemBackendFeature);

      await hooks.callHook("error", {
        op: operationName,
        path: args[0] as string,
        error,
      });

      throw error;
    };

    return unsupportedOperation as NonNullable<BackendOperationMap[T]>;
  }

  const wrappedOperation = async (...args: unknown[]) => {
    try {
      const beforePayload = getPayloadForHook(operationName, "before", args);
      await callBackendHook(hooks, `${operationName}:before` as HookKey, beforePayload);

      const result = await (operation as (...callArgs: unknown[]) => Promise<unknown>).apply(operations, args);

      const afterPayload = getPayloadForHook(operationName, "after", args, result);
      await callBackendHook(hooks, `${operationName}:after` as HookKey, afterPayload);

      return result;
    } catch (error) {
      return handleError(operationName, args, error, hooks);
    }
  };

  return wrappedOperation as NonNullable<BackendOperationMap[T]>;
}

async function handleError(
  operation: keyof BackendOperationMap,
  args: unknown[],
  error: unknown,
  hooks: HookableCore<BackendHooks>,
): Promise<never> {
  const normalizedError = error instanceof Error
    ? error
    : new Error(`Non-Error thrown in '${String(operation)}' operation: ${String(error)}`);

  if (isMSWError(normalizedError)) {
    throw normalizedError;
  }

  await hooks.callHook("error", {
    op: operation,
    path: args[0] as string,
    error: normalizedError,
  });

  if (normalizedError instanceof BackendError || normalizedError instanceof PathUtilsBaseError) {
    throw normalizedError;
  }

  debug?.("Unexpected error in backend operation", {
    operation: String(operation),
    error: normalizedError.message,
  });

  throw new Error(`Unexpected error in '${String(operation)}' operation: ${normalizedError.message}`, {
    cause: normalizedError,
  });
}
