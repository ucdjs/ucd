import { afterAll, afterEach, beforeAll } from "vitest";
import { MSW_SERVER } from "../msw-utils/msw";

beforeAll(() => MSW_SERVER.listen({ onUnhandledRequest: "error" }));
afterAll(() => MSW_SERVER.close());
afterEach(() => MSW_SERVER.resetHandlers());
