/* eslint-disable node/prefer-global/process */

export const isCaseSensitive: boolean = /* @__PURE__ */ (() => "process" in globalThis
  && typeof globalThis.process === "object"
  && "platform" in globalThis.process
  && typeof globalThis.process.platform === "string"
  && (globalThis.process.platform !== "win32" && globalThis.process.platform !== "darwin"))();

export const isWindows: boolean = /* @__PURE__ */ (() => "process" in globalThis
  && typeof globalThis.process === "object"
  && "platform" in globalThis.process
  && typeof globalThis.process.platform === "string"
  && globalThis.process.platform === "win32")();
