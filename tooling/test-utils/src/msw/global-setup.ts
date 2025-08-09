import { afterAll, afterEach, beforeAll } from "vitest";
import { MSW_SERVER } from "./msw";

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
