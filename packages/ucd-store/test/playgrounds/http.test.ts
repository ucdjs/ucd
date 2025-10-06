import { mockStoreApi } from "#internal/test-utils/mock-store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { beforeEach, describe } from "vitest";
import { createHTTPUCDStore } from "../../src/factory";
import { runPlaygroundTests } from "./__shared";

describe("http playground", async () => {
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

  const store = await createHTTPUCDStore({
    baseUrl: "https://api.ucdjs.dev",
    versions: ["15.1.0"],
  });

  runPlaygroundTests({
    store,
    requiredCapabilities: [
      "read",
      "exists",
      "listdir",
    ],
    repair: false,
    mirror: false,
    write: false,
    clean: false,
  });
});
