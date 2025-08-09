import type { UCDStore } from "@ucdjs/ucd-store";
import { createHTTPUCDStore, createNodeUCDStore } from "@ucdjs/ucd-store";
import { test as baseTest } from "vitest";

interface Fixtures {
  type: "local" | "remote";
  store: UCDStore;
}

export const test = baseTest.extend<Fixtures>({
  type: "local",
  store: async ({ type }, use) => {
    let store = null;

    if (type === "local") {
      store = await createNodeUCDStore({

      });
    } else {
      store = await createHTTPUCDStore({
      });
    }

    if (store == null) {
      throw new Error("Store was not configured correctly.");
    }

    return use(store);
  },
});

export const it = test;
