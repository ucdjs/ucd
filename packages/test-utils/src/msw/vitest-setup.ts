import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServer } from "../msw";

beforeAll(() => mswServer.listen({
  onUnhandledRequest: (_, print) => {
    // MSW will skip static assets by default,
    // but we are currently using routes that look like static assets.
    // This will print an error for any unhandled request.

    print.error();
  },
}));
afterAll(() => mswServer.close());
afterEach(() => mswServer.resetHandlers());
