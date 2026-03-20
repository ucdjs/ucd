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
    // When no optionsSchema is provided, z.never().optional() accepts undefined
    // for no-arg factories while still rejecting any unexpected options value.
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
    const backend = {
      meta: backendDefinition.meta,
      features,
      hook: hooks.hook.bind(hooks),
    } as FileSystemBackend;

    backend.read = createOperationWrapper("read", { hooks, operations, executionContext: backend });
    backend.readBytes = createOperationWrapper("readBytes", { hooks, operations, executionContext: backend });
    backend.list = createOperationWrapper("list", { hooks, operations, executionContext: backend });
    backend.exists = createOperationWrapper("exists", { hooks, operations, executionContext: backend });
    backend.stat = createOperationWrapper("stat", { hooks, operations, executionContext: backend });
    backend.write = createOperationWrapper("write", { hooks, operations, executionContext: backend });
    backend.mkdir = createOperationWrapper("mkdir", { hooks, operations, executionContext: backend });
    backend.remove = createOperationWrapper("remove", { hooks, operations, executionContext: backend });
    backend.copy = createOperationWrapper("copy", { hooks, operations, executionContext: backend });

    if (backendDefinition.symbol) {
      (backend as unknown as Record<symbol, boolean>)[backendDefinition.symbol] = true;
    }

    return backend;
  };
}
