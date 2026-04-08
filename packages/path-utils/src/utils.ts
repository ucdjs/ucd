/* eslint-disable node/prefer-global/process */

export const isCaseSensitive: boolean = /* @__PURE__ */ (() => "process" in globalThis
  && typeof globalThis.process === "object"
  && "platform" in globalThis.process
  && typeof globalThis.process.platform === "string"
  && (globalThis.process.platform !== "win32" && globalThis.process.platform !== "darwin"))();

export const osPlatform: NodeJS.Platform | null = /* @__PURE__ */ (() => {
  if ("process" in globalThis
    && typeof globalThis.process === "object"
    && "platform" in globalThis.process
    && typeof globalThis.process.platform === "string") {
    return globalThis.process.platform;
  }

  return null;
})();
