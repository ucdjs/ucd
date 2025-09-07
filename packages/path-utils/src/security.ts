import { prependLeadingSlash } from "@luxass/utils";
import pathe from "pathe";
import {
  CONTROL_CHARACTER_RE,
  MAX_DECODING_ITERATIONS,
  WINDOWS_DRIVE_RE,
  WINDOWS_UNC_ROOT_RE,
} from "./constants";
import {
  FailedToDecodePathError,
  IllegalCharacterInPathError,
  MaximumDecodingIterationsExceededError,
  PathTraversalError,
  WindowsDriveMismatchError,
  WindowsPathBehaviorNotImplementedError,
  WindowsPathTypeMismatchError,
  WindowsUNCShareMismatchError,
} from "./errors";
import { getAnyUNCRoot, getWindowsDriveLetter, isUNCPath, isWindowsDrivePath, toUnixFormat } from "./platform";
import { isCaseSensitive, osPlatform } from "./utils";

/**
 * Checks if the resolved path is within the specified base path, considering case sensitivity.
 * This function normalizes paths, applies leading slashes, and ensures the resolved path starts with the base path
 * followed by a separator to prevent partial matches.
 * @param {string} resolvedPath - The path to check, must be a non-empty string.
 * @param {string} basePath - The base path to check against, must be a non-empty string.
 * @returns {boolean} True if the resolved path is within the base path, false otherwise.
 */
export function isWithinBase(resolvedPath: string, basePath: string): boolean {
  if (typeof resolvedPath !== "string" || typeof basePath !== "string") {
    return false;
  }

  if (resolvedPath.trim() === "" || basePath.trim() === "") {
    return false;
  }

  // we apply leading slashes after we have verified that the inputs isn't empty.
  basePath = prependLeadingSlash(basePath.trim());
  resolvedPath = prependLeadingSlash(resolvedPath.trim());

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

  // decode the input path until there are no more encoded segments
  let decodedPath: string;
  try {
    decodedPath = decodePathSafely(inputPath);
  } catch {
    throw new FailedToDecodePathError();
  }

  basePath = (isWindowsDrivePath(basePath) || isUNCPath(basePath))
    ? basePath
    : prependLeadingSlash(basePath);
  inputPath = (isWindowsDrivePath(inputPath) || isUNCPath(inputPath))
    ? inputPath
    : prependLeadingSlash(inputPath);

  // normalize the base path to absolute form
  const normalizedBasePath = pathe.normalize(basePath);

  const illegalMatch = decodedPath.match(CONTROL_CHARACTER_RE);
  if (decodedPath.includes("\0") || illegalMatch != null) {
    const illegalChar = decodedPath.includes("\0") ? "\0" : (illegalMatch?.[0] ?? "[unknown]");
    throw new IllegalCharacterInPathError(illegalChar);
  }

  const baseUNCRootAny = getAnyUNCRoot(basePath);
  const inputUNCRootAny = getAnyUNCRoot(decodedPath);

  // If both paths are UNC, and they are using different shares.
  // We can just early throw, since there isn't any reason to continue.
  if (
    baseUNCRootAny
    && inputUNCRootAny
    && baseUNCRootAny.toLowerCase() !== inputUNCRootAny.toLowerCase()
  ) {
    throw new WindowsUNCShareMismatchError(baseUNCRootAny, inputUNCRootAny);
  }

  let resolvedPath: string;

  const absoluteInputPath = pathe.resolve(decodedPath);
  const isAbsoluteInput
    = WINDOWS_DRIVE_RE.test(decodedPath)
      || WINDOWS_UNC_ROOT_RE.test(decodedPath)
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
  if (isAbsoluteInput && isWithinBase(absoluteInputPath, normalizedBasePath)) {
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

  if (isWindows && (WINDOWS_DRIVE_RE.test(decodedPath)
    || WINDOWS_UNC_ROOT_RE.test(decodedPath))) {
    return internal_resolveWindowsPath(basePath, decodedPath);
  }

  // convert to unix format but don't normalize yet to preserve traversal sequences
  const unixPath = decodedPath.replace(/\\/g, "/");

  if (pathe.isAbsolute(unixPath)) {
    resolvedPath = handleAbsolutePath(unixPath, normalizedBasePath);
  } else {
    resolvedPath = handleRelativePath(unixPath, normalizedBasePath);
  }

  // final boundary validation
  if (!isWithinBase(resolvedPath, normalizedBasePath)) {
    throw new PathTraversalError(normalizedBasePath, resolvedPath);
  }

  // normalize to platform-native format for final output
  const normalized = pathe.normalize(resolvedPath);

  return normalized;
}

export function internal_resolveWindowsPath(basePath: string, decodedPath: string): string {
  // If the decoded path is a Windows drive path and the base path is a UNC path
  if (isWindowsDrivePath(decodedPath) && isUNCPath(basePath)) {
    throw new WindowsPathTypeMismatchError("UNC", "drive-letter absolute");
  }

  // If the decoded path is a UNC path and the base path is a Windows drive path
  if (isUNCPath(decodedPath) && isWindowsDrivePath(basePath)) {
    throw new WindowsPathTypeMismatchError("drive-letter", "UNC absolute");
  }

  // Both base path and input path is Windows drive paths
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
      throw new WindowsDriveMismatchError(baseDriveLetter, inputDriveLetter);
    }

    // We start by normalizing the decoded path, to ensure that all ../ is resolved.
    const normalizedDecodedPath = pathe.normalize(decodedPath);

    // If the decoded path is outside the base path, then we throw an error.
    if (!isWithinBase(normalizedDecodedPath, normalizedBasePath)) {
      throw new PathTraversalError(normalizedBasePath, normalizedDecodedPath);
    }

    return pathe.normalize(normalizedDecodedPath);
  }

  if (isUNCPath(decodedPath) && isUNCPath(basePath)) {
    const inputUNCRoot = getAnyUNCRoot(decodedPath);
    const baseUNCRoot = getAnyUNCRoot(basePath);

    const isSameShare = baseUNCRoot != null && inputUNCRoot != null
      && baseUNCRoot.toLowerCase() === inputUNCRoot.toLowerCase();

    if (!isSameShare) {
      throw new WindowsUNCShareMismatchError(String(baseUNCRoot), String(inputUNCRoot));
    }

    // extract the tail part after the UNC root, removing leading separators
    const tailAfterRoot = inputUNCRoot
      ? decodedPath.slice(inputUNCRoot.length).replace(/^[/\\]+/, "")
      : decodedPath.replace(/^\\+/, "");

    const constructedPath = tailAfterRoot
      ? pathe.join(basePath, tailAfterRoot)
      : pathe.normalize(basePath);

    // check if the constructed path is within boundary
    const normalizedBase = pathe.normalize(basePath);
    if (!isWithinBase(constructedPath, normalizedBase)) {
      console.error("Path traversal detected in internal_resolveWindowsPath");
      throw new PathTraversalError(normalizedBase, constructedPath);
    }

    return constructedPath;
  }

  throw new WindowsPathBehaviorNotImplementedError();
}

/**
 * Handles absolute Unix-style paths by treating them as relative to the base path boundary.
 * @internal
 */
function handleAbsolutePath(absoluteUnixPath: string, basePath: string): string {
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
function handleRelativePath(relativeUnixPath: string, basePath: string): string {
  // current directory references point to base path
  if (relativeUnixPath === "." || relativeUnixPath === "./") {
    return basePath;
  }

  return pathe.resolve(basePath, relativeUnixPath);
}
