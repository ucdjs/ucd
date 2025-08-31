import type {
  FileSystemBridgeCapabilities,
  FileSystemBridgeCapabilityKey,
  FileSystemBridgeFactory,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
} from "./types";
import { z } from "zod";
import { BridgeBaseError, BridgeGenericError, BridgeUnsupportedOperation } from "./errors";
import { resolveSafePath } from "./utils";

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

    const bridge = fsBridge.setup({
      options,
      state: state ?? {} as TState,
      resolveSafePath,
    });

    const capabilities = inferCapabilitiesFromOperations(bridge);

    // create a proxy that throws for unsupported operations and wraps methods in try-catch
    const proxiedBridge = new Proxy(bridge, {
      get(target, prop) {
        if (prop === "capabilities") {
          return capabilities;
        }

        // if it's an operation method and not implemented, throw
        if (typeof prop === "string" && prop in capabilities) {
          if (!target[prop as keyof typeof target]) {
            return () => {
              throw new BridgeUnsupportedOperation(prop as FileSystemBridgeCapabilityKey);
            };
          }

          // eslint-disable-next-line ts/no-unsafe-function-type
          const originalMethod = target[prop as keyof typeof target] as Function;

          if (typeof originalMethod === "function") {
            return (...args: any[]) => {
              return originalMethod(...args)
                .catch((error: unknown) => {
                  // re-throw custom bridge errors directly
                  if (error instanceof BridgeBaseError) {
                    throw error;
                  }

                  // wrap unexpected errors in BridgeGenericError
                  throw new BridgeGenericError(
                    `Unexpected error in ${prop} operation: ${error instanceof Error ? error.message : String(error)}`,
                    error instanceof Error ? error : undefined,
                  );
                });
            };
          }
        }

        return target[prop as keyof typeof target];
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
