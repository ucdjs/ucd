import type { PathFilter } from "@ucdjs-internal/shared";
import type { UCDClient } from "@ucdjs/client";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type {
  InternalUCDStoreContext,
  UCDStoreContext,
} from "../types";

/**
 * Creates an internal store context object.
 * This context is used internally by store methods and operations.
 *
 * @internal
 */
export function createInternalContext(options: {
  client: UCDClient;
  filter: PathFilter;
  fs: FileSystemBridge;
  basePath: string;
  versions: string[];
  lockfilePath: string;
}): InternalUCDStoreContext {
  return {
    client: options.client,
    filter: options.filter,
    fs: options.fs,
    basePath: options.basePath,
    versions: [...options.versions],
    lockfilePath: options.lockfilePath,
  };
}

/**
 * Creates the public-facing context properties from internal context.
 * This includes only the properties that should be exposed in the public API.
 *
 * @internal
 */
export function createPublicContext(
  context: InternalUCDStoreContext,
): UCDStoreContext {
  return {
    get basePath() {
      return context.basePath;
    },
    get versions() {
      return Object.freeze([...context.versions]);
    },
    get fs() {
      return context.fs;
    },
  };
}
