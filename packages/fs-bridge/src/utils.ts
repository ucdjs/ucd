import type { Mock, MockInstance } from "vitest";
import type {
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
  HookPayload,
  HookPayloadMap,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { BridgeGenericError } from "./errors";

const debug = createDebugger("ucdjs:fs-bridge:utils");

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

/**
 * Detects whether the bridge operates in async mode by inspecting required operations.
 *
 * A bridge is considered "async mode" if ANY of the required operations (read, exists, listdir)
 * is an async function. This ensures consistent error handling for unsupported operations.
 *
 * @internal
 *
 * @param {FileSystemBridgeOperations} operations - The bridge operations object
 * @returns {boolean} true if the bridge is in async mode, false for sync mode
 */
export function detectBridgeRuntimeMode(operations: FileSystemBridgeOperations): boolean {
  // Check only required operations since they are always implemented
  const requiredOperations = [
    operations.read,
    operations.exists,
    operations.listdir,
  ];

  // If any required operation is async, the entire bridge is in async mode
  return requiredOperations.some((op) => {
    if (op.constructor.name === "AsyncFunction") {
      debug?.("Detected async operation, setting bridge to async mode");
      return true;
    }

    // If the function is a Vitest Mock, we need to check how it was mocked
    // Vitest Mocks can be async or sync depending on how they were created
    //
    // E.g.
    // vi.fn().mockResolvedValue(...)  => async
    // vi.fn().mockReturnValue(...)    => sync
    const isVitestMock = op != null && ("_isMockFunction" in op) && op._isMockFunction === true;
    if (isVitestMock) {
      return detectVitestMockFunctionRuntimeMode(op as any);
    }

    return false;
  });
}

const asyncFunctionNames = [
  "Promise.resolve",
  "Promise.reject",
  "new Promise",
  "async",
];

export function detectVitestMockFunctionRuntimeMode(mock: Mock | MockInstance): boolean {
  // Check the mock's results to see if it returns a Promise
  // Vitest stores mock results in .mock.results array
  if (mock.mock?.results && mock.mock.results.length > 0) {
    const lastResult = mock.mock.results[mock.mock.results.length - 1];

    // If the result type is 'return' and value is a Promise, it's async
    if (lastResult?.type === "return" && lastResult.value instanceof Promise) {
      debug?.("Detected async Vitest mock (from results), setting bridge to async mode");
      return true;
    }
  }

  if (mock.getMockImplementation) {
    const impl = mock.getMockImplementation();

    // Check if the implementation itself is async
    if (impl && impl.constructor.name === "AsyncFunction") {
      debug?.("Detected async Vitest mock (implementation is AsyncFunction), setting bridge to async mode");
      return true;
    }

    const fnSignature = impl?.toString() || "";
    const isAsyncFunctionImplementation = asyncFunctionNames.some((name) => fnSignature.includes(name));

    // If there is multiple returns in the fnSignature, we can't be sure.
    // So we check if both async and sync patterns exist, and if so, we default to async.
    //
    // This covers cases where the mock implementation has mixed return patterns. (This should never happen, but just in case.)
    if (isAsyncFunctionImplementation && fnSignature.includes("return")) {
      debug?.("Detected mixed async/sync Vitest mock (multiple return patterns), defaulting to async mode");
      return true;
    }

    // For mockResolvedValue(), the implementation is a regular function that returns Promise.resolve()
    // We can check the implementation's toString() to see if it wraps Promise.resolve
    if (impl && isAsyncFunctionImplementation) {
      debug?.("Detected async Vitest mock (implementation returns Promise), setting bridge to async mode");
      return true;
    }
  }

  return false;
}
