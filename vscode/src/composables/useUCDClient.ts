import type { UCDClient } from "@ucdjs/client";
import { tryOr } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { defineService, ref, watch } from "reactive-vscode";
import { config } from "../config";
import { logger } from "../logger";

export const useUCDClient = defineService(() => {
  const client = ref<UCDClient | null>(null);

  watch(
    () => config["api-base-url"],
    async (newVal, oldVal) => {
      if (newVal === oldVal) {
        return;
      }

      const createdClient = await tryOr({
        try: () => createUCDClient(newVal),
        err: (err) => {
          logger.error("Failed to create UCD client:", err);
          return null;
        },
      });

      client.value = createdClient;
    },
    { immediate: true },
  );

  return client;
});
