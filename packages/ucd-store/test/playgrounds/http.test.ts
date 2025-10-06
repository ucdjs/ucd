import { describe } from "vitest";
import { createHTTPUCDStore } from "../../src/factory";
import { runPlaygroundTests } from "./__shared";

describe("http playground", async () => {
  const store = await createHTTPUCDStore({
    baseUrl: "https://api.ucdjs.dev",
    basePath: "/ucd-data",
    versions: ["15.1.0"],
  });

  runPlaygroundTests({
    store,
    testVersion: "15.1.0",
    skipOrphanedTest: true, // HTTP is read-only
  });
});
