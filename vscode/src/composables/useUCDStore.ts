import type { UCDStore } from "@ucdjs/ucd-store";
import { createHTTPUCDStore, createUCDStore } from "@ucdjs/ucd-store";
import { createSingletonComposable, ref, watch } from "reactive-vscode";
import { config } from "../config";
import { vscodeFSBridge } from "../lib/vscode-fs-bridge";
import { logger } from "../logger";

export const useUCDStore = createSingletonComposable(() => {
  const store = ref<UCDStore | null>(null);

  const createStoreFromConfig = async (localDataFilesStore: string | null): Promise<UCDStore> => {
    const globalFilters = config["store-filters"];
    logger.info("Creating UCD store with config:", JSON.stringify({ localDataFilesStore, globalFilters }));

    let _store: UCDStore | null = null;
    if (localDataFilesStore == null || localDataFilesStore.trim() === "") {
      _store = await createHTTPUCDStore({
        globalFilters,
      });
    } else {
      _store = createUCDStore({
        globalFilters,
        fs: vscodeFSBridge(),
        basePath: localDataFilesStore,
      });
    }

    try {
      await _store.init();
    } catch (error) {
      console.error("Failed to initialize UCD store:", error);
    }

    return _store;
  };

  watch(
    () => config["local-store-path"],
    async (newVal, oldVal) => {
      if (newVal === oldVal) {
        return;
      }

      try {
        store.value = await createStoreFromConfig(newVal);
      } catch (error) {
        console.error("Failed to create UCD store:", error);
        store.value = null;
      }
    },
    { immediate: true },
  );

  return store;
});
