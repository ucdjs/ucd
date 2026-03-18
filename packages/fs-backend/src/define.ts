import type {
  BackendDefinition,
  BackendFactory,
  BackendHooks,
  FileSystemBackend,
} from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { HookableCore } from "hookable";
import { z } from "zod";
import { BackendSetupError } from "./errors";
import { createOperationWrapper, inferFeaturesFromOperations } from "./internal-utils";

const debug = createDebugger("ucdjs:fs-backend:define");

export function defineBackend<
  TOptionsSchema extends z.ZodType = z.ZodNever,
>(
  backendDefinition: BackendDefinition<TOptionsSchema>,
): BackendFactory<TOptionsSchema> {
  return (...args) => {
    const parsedOptions = (backendDefinition.optionsSchema ?? z.never().optional()).safeParse(args[0]);

    if (!parsedOptions.success) {
      debug?.("Invalid options provided to file system backend", {
        error: parsedOptions.error.message,
      });
      throw new Error(`Invalid options provided to file system backend: ${parsedOptions.error.message}`);
    }

    let operations;
    try {
      operations = backendDefinition.setup(parsedOptions.data as z.output<TOptionsSchema>);
    } catch (error) {
      throw new BackendSetupError(
        "Failed to setup file system backend",
        error instanceof Error ? error : undefined,
      );
    }

    const hooks = new HookableCore<BackendHooks>();
    const features = inferFeaturesFromOperations(operations);

    const backend: FileSystemBackend = {
      meta: backendDefinition.meta,
      features,
      hook: hooks.hook.bind(hooks),
      read: createOperationWrapper("read", { hooks, operations }),
      readBytes: createOperationWrapper("readBytes", { hooks, operations }),
      list: createOperationWrapper("list", { hooks, operations }),
      exists: createOperationWrapper("exists", { hooks, operations }),
      stat: createOperationWrapper("stat", { hooks, operations }),
      write: createOperationWrapper("write", { hooks, operations }),
      mkdir: createOperationWrapper("mkdir", { hooks, operations }),
      remove: createOperationWrapper("remove", { hooks, operations }),
      copy: createOperationWrapper("copy", { hooks, operations }),
    };

    if (backendDefinition.symbol) {
      (backend as unknown as Record<symbol, boolean>)[backendDefinition.symbol] = true;
    }

    return backend;
  };
}
