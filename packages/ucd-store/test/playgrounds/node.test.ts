import { mockStoreApi } from "#internal/test-utils/mock-store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { beforeEach, describe } from "vitest";
import { testdir } from "vitest-testdirs";
import { createNodeUCDStore } from "../../src/factory";
import { runPlaygroundTests } from "./__shared";

describe("node playground", async () => {
  beforeEach(() => {
    mockStoreApi({
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/:version/file-tree": [{
          type: "file",
          name: "ArabicShaping.txt",
          path: "ArabicShaping.txt",
          lastModified: 1724601900000,
        }],
      },
    });
  });

  const basePath = await testdir();

  const store = await createNodeUCDStore({
    basePath,
    versions: ["15.1.0"],
  });

  runPlaygroundTests({
    store,
    requiredCapabilities: [
      "write",
      "read",
      "mkdir",
      "exists",
      "listdir",
      "rm",
    ],
  });
});
