/* eslint-disable node/prefer-global/process */

export const isWindows = process.platform === "win32";
export const isMac = process.platform === "darwin";
export const isLinux = process.platform === "linux";

export const isUnix = isLinux || isMac;
