import type { UCDStore } from "@ucdjs/ucd-store";
import type { Ref } from "reactive-vscode";
import { createHTTPUCDStore, createUCDStore } from "@ucdjs/ucd-store";
import { defineService, ref, watch } from "reactive-vscode";
import { config } from "../config";
import { vscodeFSBackend } from "../lib/vscode-fs-backend";
import { logger } from "../logger";

export const useUCDStore = defineService(() => {
  const store = ref<UCDStore | null>(null);

  const createStoreFromConfig = async (localDataFilesStore: string | null): Promise<UCDStore> => {
    const globalFilters = config["store-filters"];
    logger.info("Creating UCD store with config:", JSON.stringify({ localDataFilesStore, globalFilters }));

    if (localDataFilesStore == null || localDataFilesStore.trim() === "") {
      return createHTTPUCDStore({
        bridgeBaseUrl: config["store-url"],
        baseUrl: config["api-base-url"],
        globalFilters,
      });
    }

    return createUCDStore({
      baseUrl: config["api-base-url"],
      globalFilters,
      fs: vscodeFSBackend,
      fsOptions: {
        basePath: localDataFilesStore,
      },
    });
  };

  watch(
    () => config["local-store-path"],
    async (newVal, oldVal) => {
      if (newVal === oldVal) {
        return;
      }

      try {
        store.value = await createStoreFromConfig(newVal);
      } catch (err) {
        console.error("Failed to create UCD store:", err);
        store.value = null;
      }
    },
    { immediate: true },
  );

  return store as Ref<UCDStore | null>;
});
