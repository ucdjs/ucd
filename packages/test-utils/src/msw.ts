import type { SetupServerApi } from "msw/node";

declare global {
  // eslint-disable-next-line vars-on-top
  var __ucd_msw_server: SetupServerApi | undefined;
}

export { createMockFetch } from "@luxass/msw-utils";
export { http, HttpResponse } from "msw";
