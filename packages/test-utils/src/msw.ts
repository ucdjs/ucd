import type { SetupServerApi } from "msw/node";
import { createMockFetch } from "@luxass/msw-utils";

declare global {
  // eslint-disable-next-line vars-on-top
  var __ucd_msw_server: SetupServerApi | undefined;
}

export { createMockFetch } from "@luxass/msw-utils";
export { http, HttpResponse } from "msw";

export const mockFetch = globalThis.__ucd_msw_server
  ? createMockFetch({ mswServer: globalThis.__ucd_msw_server })
  : () => {
      throw new Error(
        "mockFetch can only be used in an environment where MSW is set up, such as in Vitest with the @ucdjs/test-utils/msw/vitest-setup module imported.",
      );
    };
