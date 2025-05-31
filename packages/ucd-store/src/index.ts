import type { UCDStoreOptions } from "./store";
import { UCDStore } from "./store";

export function createUCDStore(options: UCDStoreOptions): UCDStore {
  return new UCDStore(options);
}

export { UCDStore, type UCDStoreOptions };
