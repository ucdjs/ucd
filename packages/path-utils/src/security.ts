import { prependLeadingSlash } from "@luxass/utils";
import { createDebugger } from "@ucdjs-internal/shared";
import pathe from "pathe";
import {
  CONTROL_CHARACTER_RE,
  MAX_DECODING_ITERATIONS,
  WINDOWS_DRIVE_RE,
} from "./constants";
import {
  FailedToDecodePathError,
  IllegalCharacterInPathError,
  MaximumDecodingIterationsExceededError,
  PathTraversalError,
  WindowsDriveMismatchError,
  WindowsPathBehaviorNotImplementedError,
} from "./errors";
import { assertNotUNCPath, getWindowsDriveLetter, isWindowsDrivePath, toUnixFormat } from "./platform";
import { isCaseSensitive, osPlatform } from "./utils";

const debug = createDebugger("ucdjs:path-utils:security");

/**
 * Checks if the resolved path is within the specified base path, considering case sensitivity.
 * This function normalizes paths, applies leading slashes, and ensures the resolved path starts with the base path
 * followed by a separator to prevent partial matches.
 * @param {string} basePath - The base path to check against, must be a non-empty string.
 * @param {string} resolvedPath - The path to check, must be a non-empty string.
 * @returns {boolean} True if the resolved path is within the base path, false otherwise.
 */
export function isWithinBase(basePath: string, resolvedPath: string): boolean {
  if (typeof resolvedPath !== "string" || typeof basePath !== "string") {
    return false;
  }

  resolvedPath = resolvedPath.trim();
  basePath = basePath.trim();

  if (resolvedPath === "" || basePath === "") {
    return false;
  }

  // check for UNC paths and reject them early
  assertNotUNCPath(resolvedPath);
  assertNotUNCPath(basePath);

  // we apply leading slashes after we have verified that the inputs isn't empty.
  basePath = isWindowsDrivePath(basePath)
    ? basePath
    : prependLeadingSlash(basePath);
  resolvedPath = isWindowsDrivePath(resolvedPath)
    ? resolvedPath
    : prependLeadingSlash(resolvedPath);

  const normalizedResolved = pathe.normalize(resolvedPath);
  const normalizedBase = pathe.normalize(basePath);

  const resolved = isCaseSensitive ? normalizedResolved : normalizedResolved.toLowerCase();
  const base = isCaseSensitive ? normalizedBase : normalizedBase.toLowerCase();

  // check if the resolved path starts with the base path. To prevent partial matches
  // like /root vs /root2, we append a separator unless the base path already ends
  // with one (such as the root directory "/").
  const baseWithSeparator = base.endsWith(pathe.sep) ? base : base + pathe.sep;
  return resolved === base || resolved.startsWith(baseWithSeparator);
}

export function decodePathSafely(encodedPath: string): string {
  if (typeof encodedPath !== "string") {
    throw new TypeError("Encoded path must be a string");
  }

  let decodedPath = encodedPath;
  let previousPath: string;
  let iterations = 0;

  do {
    previousPath = decodedPath;

    try {
      // try to url decode
      decodedPath = decodeURIComponent(decodedPath);
    } catch {
      // we continue even though decoding failed
    }

    // handle common manual encodings
    decodedPath = decodedPath
      .replace(/%2e/gi, ".") // encoded dots
      .replace(/%2f/gi, "/") // encoded forward slashes
      .replace(/%5c/gi, "\\"); // encoded backslashes

    iterations++;
  } while (decodedPath !== previousPath && iterations < MAX_DECODING_ITERATIONS);

  if (iterations >= MAX_DECODING_ITERATIONS) {
    debug?.("Maximum decoding iterations exceeded", { iterations, originalPath: encodedPath, finalPath: decodedPath });
    throw new MaximumDecodingIterationsExceededError();
  }

  return decodedPath;
}

export function resolveSafePath(basePath: string, inputPath: string): string {
  if (typeof basePath !== "string") {
    throw new TypeError("Base path must be a string");
  }

  basePath = basePath.trim();
  inputPath = inputPath.trim();

  if (basePath === "") {
    throw new Error("Base path cannot be empty");
  }

  // Check for UNC paths and reject them early
  assertNotUNCPath(basePath);
  assertNotUNCPath(inputPath);

  // decode the input path until there are no more encoded segments
  let decodedPath: string;
  try {
    decodedPath = decodePathSafely(inputPath);
  } catch {
    debug?.("Failed to decode input path", { inputPath });
    throw new FailedToDecodePathError();
  }

  // Check decoded path as well in case UNC was encoded
  assertNotUNCPath(decodedPath);

  basePath = isWindowsDrivePath(basePath)
    ? basePath
    : prependLeadingSlash(basePath);
  inputPath = isWindowsDrivePath(inputPath)
    ? inputPath
    : prependLeadingSlash(inputPath);

  // normalize the base path to absolute form
  const normalizedBasePath = pathe.normalize(basePath);

  const illegalMatch = decodedPath.match(CONTROL_CHARACTER_RE);
  if (decodedPath.includes("\0") || illegalMatch != null) {
    const illegalChar = decodedPath.includes("\0") ? "\0" : (illegalMatch?.[0] ?? "[unknown]");
    debug?.("Illegal character detected in path", { decodedPath, illegalChar });
    throw new IllegalCharacterInPathError(illegalChar);
  }

  let resolvedPath: string;

  const absoluteInputPath = pathe.normalize(decodedPath);
  const isAbsoluteInput
    = WINDOWS_DRIVE_RE.test(decodedPath)
      || pathe.isAbsolute(toUnixFormat(decodedPath));

  // If the input path is "within" the base path, we can just return as-is.
  // This is to ensure that something like "C:\Users\John\Documents\Projects\file.txt"
  // is treated as a valid path without unnecessary modifications.

  // Examples:
  // Windows
  // Base Path: C:\Users\John
  // Input Path: C:\Users\John\Documents\Projects\file.txt
  // Output Path: C:\Users\John\Documents\Projects\file.txt
  // -----
  // Unix
  // Base Path: /home/user
  // Input Path: /home/user/docs/file.txt
  // Output Path: /home/user/docs/file.txt
  if (isAbsoluteInput && isWithinBase(normalizedBasePath, absoluteInputPath)) {
    // Preserve base path casing by extracting tail and combining with original base
    const normalizedBase = pathe.normalize(basePath);
    const normalizedInput = pathe.normalize(absoluteInputPath);

    if (normalizedInput.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
      const tailAfterBase = normalizedInput.slice(normalizedBase.length);
      return pathe.normalize(normalizedBase + tailAfterBase);
    }

    return pathe.normalize(absoluteInputPath);
  }

  // If either the process.platform is win32, or we are a case insensitive platform, that isn't darwin.
  const isWindows = osPlatform === "win32" || (!isCaseSensitive && osPlatform !== "darwin");

  if (isWindows && isWindowsDrivePath(decodedPath)) {
    return internal_resolveWindowsPath(basePath, decodedPath);
  }

  // convert to unix format but don't normalize yet to preserve traversal sequences
  const unixPath = decodedPath.replace(/\\/g, "/");

  if (pathe.isAbsolute(unixPath)) {
    resolvedPath = internal_handleAbsolutePath(unixPath, normalizedBasePath);
  } else {
    resolvedPath = internal_handleRelativePath(unixPath, normalizedBasePath);
  }

  if (!isWithinBase(normalizedBasePath, resolvedPath)) {
    debug?.("Path traversal detected", {
      basePath: normalizedBasePath,
      accessedPath: resolvedPath,
    });
    throw new PathTraversalError(normalizedBasePath, resolvedPath);
  }

  // normalize to platform-native format for final output
  const normalized = pathe.normalize(resolvedPath);

  return normalized;
}

/**
 * @internal
 */
export function internal_resolveWindowsPath(basePath: string, decodedPath: string): string {
  // Both base path and input path are Windows drive paths
  if (isWindowsDrivePath(decodedPath) && isWindowsDrivePath(basePath)) {
    const normalizedBasePath = pathe.normalize(basePath);

    // 1. First verify that the paths use the same drive letter
    // 2. If they use different drive letters, throw a drive mismatch error
    // 3. If they use the same drive letter, verify the path isn't escaping the base path
    // 4. If the path is escaping, throw a path traversal error
    // 5. If the path stays within bounds, proceed with path resolution

    // Get the drive letters from both input and base path.
    const baseDriveLetter = getWindowsDriveLetter(basePath);
    const inputDriveLetter = getWindowsDriveLetter(decodedPath);

    // If either the drive letters is null, or they are not equal, throw a drive mismatch error
    if (baseDriveLetter != null && inputDriveLetter != null && baseDriveLetter !== inputDriveLetter) {
      debug?.("Drive letter mismatch detected", { baseDriveLetter, inputDriveLetter });
      throw new WindowsDriveMismatchError(baseDriveLetter, inputDriveLetter);
    }

    // We start by normalizing the decoded path, to ensure that all ../ is resolved.
    const normalizedDecodedPath = pathe.normalize(decodedPath);

    // If the decoded path is outside the base path, then we throw an error.
    if (!isWithinBase(normalizedBasePath, normalizedDecodedPath)) {
      debug?.("Windows path traversal detected", {
        basePath: normalizedBasePath,
        accessedPath: normalizedDecodedPath,
      });
      throw new PathTraversalError(normalizedBasePath, normalizedDecodedPath);
    }

    return pathe.normalize(normalizedDecodedPath);
  }

  throw new WindowsPathBehaviorNotImplementedError();
}

/**
 * Handles absolute Unix-style paths by treating them as relative to the base path boundary.
 * @internal
 */
function internal_handleAbsolutePath(absoluteUnixPath: string, basePath: string): string {
  // virtual filesystem boundary model: absolute paths are relative to boundary root
  if (absoluteUnixPath === "/") {
    // root reference points to boundary root
    return basePath;
  }

  // strip leading slash and resolve relative to boundary root
  const pathWithoutLeadingSlash = absoluteUnixPath.replace(/^\/+/, "");
  return pathe.resolve(basePath, pathWithoutLeadingSlash);
}

/**
 * Handles relative Unix-style paths by resolving them against the base path.
 * @internal
 */
function internal_handleRelativePath(relativeUnixPath: string, basePath: string): string {
  // current directory references point to base path
  if (relativeUnixPath === "." || relativeUnixPath === "./") {
    return basePath;
  }

  return pathe.resolve(basePath, relativeUnixPath);
}
