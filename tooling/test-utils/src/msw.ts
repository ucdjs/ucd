import { createMockFetch } from "@luxass/msw-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const MSW_SERVER = setupServer();

export const mockFetch = createMockFetch({
  mswServer: MSW_SERVER,
});

export { http, HttpResponse };
