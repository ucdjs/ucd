import {
  basename as _basename,
  dirname as _dirname,
  extname as _extname,
  join as _join,
  normalize as _normalize,
  relative as _relative,
  resolve as _resolve,
} from "pathe";

export {
  FailedToDecodePathError,
  IllegalCharacterInPathError,
  MaximumDecodingIterationsExceededError,
  PathTraversalError,
  PathUtilsBaseError,
  UNCPathNotSupportedError,
  WindowsDriveMismatchError,
  WindowsPathBehaviorNotImplementedError,
} from "./errors";

export {
  assertNotUNCPath,
  getWindowsDriveLetter,
  isUNCPath,
  isWindowsDrivePath,
  stripDriveLetter,
  toUnixFormat,
} from "./platform";

export {
  decodePathSafely,
  isWithinBase,
  resolveSafePath,
} from "./security";

export { isCaseSensitive, osPlatform } from "./utils";

export const patheBasename = _basename;
export const patheDirname = _dirname;
export const patheExtname = _extname;
export const patheJoin = _join;
export const patheNormalize = _normalize;
export const patheRelative = _relative;
export const patheResolve = _resolve;
