import { describe } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../src/factory";
import { runPlaygroundTests } from "./__shared";

describe("node playground", async () => {
  const basePath = await testdir();

  const store = await createNodeUCDStore({
    basePath,
    versions: ["15.1.0"],
  });

  runPlaygroundTests({
    store,
    testVersion: "15.1.0",
  });
});
