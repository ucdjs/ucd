import { afterAll, afterEach, beforeAll } from "vitest";
import { MSW_SERVER } from "../msw-utils/msw";

console.error("MSW_SERVER", MSW_SERVER);

beforeAll(() => {
  console.error("Starting MSW server...");
  MSW_SERVER.listen({ onUnhandledRequest: "error" })
  console.error("MSW server started.");
});
afterAll(() => {
  console.error("Stopping MSW server...");
  MSW_SERVER.close();
  console.error("MSW server stopped.");
});
afterEach(() => {
  console.error("Restoring MSW handlers...");
  MSW_SERVER.restoreHandlers();
  console.error("MSW handlers restored.");
});
