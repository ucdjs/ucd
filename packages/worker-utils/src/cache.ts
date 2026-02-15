export type ClearCacheFn = (requestOrPath: Request | string) => Promise<void>;

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
