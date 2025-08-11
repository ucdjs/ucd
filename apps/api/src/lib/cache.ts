type ClearCacheFn = (requestOrPath: Request | string) => Promise<void>;

/**
 * Creates a cache clearing function for a specific cache by name.
 *
 * @param {string} name - The name of the cache to clear entries from
 * @returns {Promise<ClearCacheFn>} A function that can be called to delete specific cache entries
 *
 * @example
 * ```typescript
 * import { clearCacheEntry } from "../../lib";
 *
 * const clearMyCache = await clearCacheEntry("v1_files");
 * await clearMyCache("https://api.ucdjs.dev/api/v1/files/16.0.0"); // Clear entry by path
 * await clearMyCache(new Request("https://api.ucdjs.dev/api/v1/files/16.0.0")); // Clear entry by Request object
 * ```
 *
 * @remarks
 * This function opens the cache once and returns a reusable function for clearing
 * individual entries. The returned function accepts either a string path or a Request object.
 */
export async function clearCacheEntry(name: string): Promise<ClearCacheFn> {
  let cachePromise: Promise<Cache> | null = null;
  return async (requestOrPath: Request | string) => {
    if (!cachePromise) {
      cachePromise = caches.open(name);
    }

    const cache = await cachePromise;

    const request = typeof requestOrPath === "string" ? new Request(requestOrPath) : requestOrPath;

    await cache.delete(request);
  };
}