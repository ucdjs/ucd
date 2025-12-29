import type { OperationResult } from "@ucdjs-internal/shared";
import type { StoreError } from "../errors";
import type { InternalUCDStoreContext, SharedOperationOptions } from "../types";
import { createConcurrencyLimiter, createDebugger, wrapTry } from "@ucdjs-internal/shared";
import { computeFileHash } from "@ucdjs/lockfile";
import { UCDStoreGenericError, UCDStoreVersionNotFoundError } from "../errors";
import { getFile } from "./files/get";
import { listFiles } from "./files/list";

const debug = createDebugger("ucdjs:ucd-store:compare");

export interface CompareOptions extends SharedOperationOptions {
  /** Version to compare from */
  from: string;

  /** Version to compare to */
  to: string;

  /** Whether to compare file contents using SHA-256 hashes. Defaults to true. */
  includeFileHashes?: boolean;

  /** Concurrency for file reads when computing hashes. Defaults to 5. */
  concurrency?: number;

  /** Whether to allow falling back to API when listing/getting files */
  allowApi?: boolean;
}

export interface VersionComparison {
  from: string;
  to: string;
  files: {
    added: readonly string[];
    removed: readonly string[];
    modified: readonly string[];
    unchanged: readonly string[];
  };
  counts: {
    fromTotal: number;
    toTotal: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

/**
 * Compares two versions in the store and returns a report describing added/removed/modified/unchanged files.
 */
export async function compare(
  context: InternalUCDStoreContext,
  options?: CompareOptions,
): Promise<OperationResult<VersionComparison, StoreError>> {
  return wrapTry(async () => {
    if (!options) {
      throw new UCDStoreGenericError("Options with `from` and `to` versions are required");
    }

    const from = options.from;
    const to = options.to;

    if (!from || !to) {
      throw new UCDStoreGenericError("Both `from` and `to` versions must be specified");
    }

    if (!context.versions.includes(from)) {
      throw new UCDStoreVersionNotFoundError(from);
    }

    if (!context.versions.includes(to)) {
      throw new UCDStoreVersionNotFoundError(to);
    }

    debug?.("Comparing %s -> %s", from, to);

    const [fromFiles, fromError] = await listFiles(context, from, { allowApi: options.allowApi, filters: options.filters });
    if (fromError) throw fromError;

    const [toFiles, toError] = await listFiles(context, to, { allowApi: options.allowApi, filters: options.filters });
    if (toError) throw toError;

    const fromList = (fromFiles || []).filter((p) => p !== "snapshot.json");
    const toList = (toFiles || []).filter((p) => p !== "snapshot.json");

    const fromSet = new Set(fromList);
    const toSet = new Set(toList);

    const added = toList.filter((p) => !fromSet.has(p)).sort();
    const removed = fromList.filter((p) => !toSet.has(p)).sort();
    const common = fromList.filter((p) => toSet.has(p)).sort();

    let modified: string[] = [];
    let unchanged: string[] = [];

    const includeHashes = options.includeFileHashes !== false; // default true

    if (includeHashes && common.length > 0) {
      const concurrency = options.concurrency ?? 5;
      const limit = createConcurrencyLimiter(concurrency);

      await Promise.all(common.map((file) => limit(async () => {
        const [fromContent, fErr] = await getFile(context, from, file, { allowApi: options.allowApi, cache: false });
        if (fErr) throw fErr;

        const [toContent, tErr] = await getFile(context, to, file, { allowApi: options.allowApi, cache: false });
        if (tErr) throw tErr;

        const fromHash = await computeFileHash(fromContent);
        const toHash = await computeFileHash(toContent);

        if (fromHash !== toHash) {
          modified.push(file);
        } else {
          unchanged.push(file);
        }
      })));
    } else {
      unchanged = common.slice();
      modified = [];
    }

    const result: VersionComparison = {
      from,
      to,
      files: {
        added: Object.freeze(added),
        removed: Object.freeze(removed),
        modified: Object.freeze(modified),
        unchanged: Object.freeze(unchanged),
      },
      counts: {
        fromTotal: fromList.length,
        toTotal: toList.length,
        added: added.length,
        removed: removed.length,
        modified: modified.length,
        unchanged: unchanged.length,
      },
    };

    return result;
  });
}
