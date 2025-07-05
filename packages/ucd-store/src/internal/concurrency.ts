/**
 * Generic utility to process items with controlled concurrency
 */
export async function processConcurrently<T>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<void>,
): Promise<void> {
  // Process items in batches to control concurrency
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(batch.map(processor));
  }
}