import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

const MSW_SERVER = setupServer();
globalThis.__ucd_msw_server = MSW_SERVER;

beforeAll(() => MSW_SERVER.listen({
  onUnhandledRequest: (_, print) => {
    // MSW will skip static assets by default,
    // but we are currently using routes that look like static assets.
    // This will print an error for any unhandled request.

    print.error();
  },
}));
afterAll(() => MSW_SERVER.close());
afterEach(() => MSW_SERVER.resetHandlers());
