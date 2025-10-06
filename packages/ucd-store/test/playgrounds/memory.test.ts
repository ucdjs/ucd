import { describe } from "vitest";
import { createUCDStore } from "../../src/factory";
import { createMemoryMockFS } from "../__shared";
import { runPlaygroundTests } from "./__shared";

describe("memory playground", () => {
  const store = createUCDStore({
    basePath: "/test",
    fs: createMemoryMockFS(),
    versions: ["15.1.0"],
  });

  runPlaygroundTests({
    store,
    testVersion: "15.1.0",
  });
});
