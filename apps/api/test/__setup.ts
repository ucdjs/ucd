import { beforeEach } from "vitest";
import z from "zod";

// Clear the global registry before each test to ensure a clean state
beforeEach(() => {
  z.globalRegistry.clear();
});
