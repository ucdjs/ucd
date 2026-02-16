import { beforeEach } from "vitest";
import z from "zod";

beforeEach(() => {
  z.globalRegistry.clear();
});
