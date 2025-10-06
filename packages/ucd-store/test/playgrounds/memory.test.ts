import { mockStoreApi } from "#internal/test-utils/mock-store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { beforeEach, describe } from "vitest";
import { createUCDStore } from "../../src/factory";
import { createMemoryMockFS } from "../__shared";
import { runPlaygroundTests } from "./__shared";

describe("memory playground", () => {
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

  const memoryFS = createMemoryMockFS();

  const store = createUCDStore({
    basePath: "/test",
    fs: memoryFS,
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
