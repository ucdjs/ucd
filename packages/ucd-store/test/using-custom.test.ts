import { it } from "#internal/test-utils/vitest";
import { describe, expect } from "vitest";

describe("use scoped values", () => {
  it.scoped({ type: "local" });

  it("uses scoped value", ({ store }) => {
    expect(store).toBeDefined();
    expect(store.initialized).toBe(false);
  });

  // describe("keeps using scoped value", () => {
  //   it("uses scoped value", ({ store }) => {
  //     expect(store).toEqual({ type: "new" });
  //   });
  // });

  // describe("use different scope", () => {
  //   it.scoped({ type: "hello" });

  //   it("use different scope", ({ store }) => {
  //     expect(store).toEqual({ type: "hello" });
  //   });
  // });
});

// it("keep using the default values", ({ store }) => {
//   expect(store).toEqual({ type: "default" });
// });
