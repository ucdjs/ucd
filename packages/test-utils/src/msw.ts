import type { SetupServerApi } from "msw/node";
import { createMockFetch } from "@luxass/msw-utils";
import { setupServer } from "msw/node";

declare global {
  // eslint-disable-next-line vars-on-top
  var __ucd_msw_server: SetupServerApi | undefined;
}

export { createMockFetch } from "@luxass/msw-utils";
export { http, HttpResponse } from "msw";

export const mswServer = setupServer();
globalThis.__ucd_msw_server = mswServer;

export const mockFetch = createMockFetch({
  mswServer,
  replaceOpenAPIPathParams: true,
});
