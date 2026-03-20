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
    const normalizedLocalStorePath = localDataFilesStore?.trim() || "";
    const backendBaseUrl = config["store-url"]?.trim() || undefined;
    const globalFilters = config["store-filters"];
    logger.info("Creating UCD store with config:", JSON.stringify({
      localDataFilesStore: normalizedLocalStorePath,
      globalFilters,
      backendBaseUrl,
    }));

    if (normalizedLocalStorePath === "") {
      return createHTTPUCDStore({
        backendBaseUrl,
        baseUrl: config["api-base-url"],
        globalFilters,
      });
    }

    return createUCDStore({
      baseUrl: config["api-base-url"],
      globalFilters,
      fs: vscodeFSBackend,
      fsOptions: {
        basePath: normalizedLocalStorePath,
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
