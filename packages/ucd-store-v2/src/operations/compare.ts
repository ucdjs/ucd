import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { tryCatch } from "@ucdjs-internal/shared";

export interface CompareOptions extends SharedOperationOptions {
  /**
   * Start version for comparison (inclusive)
   */
  from: string;

  /**
   * End version for comparison (inclusive)
   */
  to: string;
}

export interface VersionComparison {
  _output: string;
}

/**
 * Compare two versions in the store
 *
 * @param {InternalUCDStoreContext} _context - Internal store context
 * @param {CompareOptions} [_options] - Compare options
 * @returns {Promise<OperationResult<VersionComparison, StoreError>>} Operation result
 */
export async function compare(
  _context: InternalUCDStoreContext,
  _options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  return tryCatch(async () => {
    return {
      _output: "Not implemented",
    };
  });
}
