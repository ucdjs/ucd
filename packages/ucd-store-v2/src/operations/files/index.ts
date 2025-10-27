import type {
  InternalUCDStoreContext,
  UCDStoreFileOperations,
} from "../../types";
import type { GetFileOptions } from "./get";
import type { ListFilesOptions } from "./list";
import type { GetFileTreeOptions } from "./tree";
import { getFile } from "./get";
import { listFiles } from "./list";
import { getFileTree } from "./tree";

/**
 * Creates the files namespace with all file-related operations.
 * Binds the internal context to each file operation.
 *
 * @param context - Internal store context with client, filters, FS bridge, and configuration
 * @returns Object with file operations (get, list, tree)
 */
export function createFilesNamespace(context: InternalUCDStoreContext): UCDStoreFileOperations {
  return {
    get: (version: string, path: string, options?: GetFileOptions) =>
      getFile(context, version, path, options),

    list: (version: string, options?: ListFilesOptions) =>
      listFiles(context, version, options),

    tree: (version: string, options?: GetFileTreeOptions) =>
      getFileTree(context, version, options),
  };
}
