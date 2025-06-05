import type { UCDStore } from "./store";
import { LocalUCDStore } from "./local";

export async function setupLocalUCDStore(
  store: UCDStore,
  versions: string[],
) {
  if (!(store instanceof LocalUCDStore)) {
    throw new TypeError(
      `[ucd-store]: Expected store to be an instance of LocalUCDStore, but got ${store.constructor.name}.`,
    );
  }

  const { basePath } = store;
  if (!basePath) {
    throw new Error(
      `[ucd-store]: Base path is not set for LocalUCDStore. Please provide a valid base path.`,
    );
  }
}
