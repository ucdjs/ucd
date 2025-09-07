import { prependLeadingSlash, trimLeadingSlash } from "@luxass/utils";
import pathe from "pathe";
import {
  CONTROL_CHARACTER_RE,
  MAX_DECODING_ITERATIONS,
  WINDOWS_DRIVE_RE,
  WINDOWS_UNC_ROOT_RE,
} from "./constants";
import { FailedToDecodePathError, IllegalCharacterInPathError, MaximumDecodingIterationsExceededError, PathTraversalError, WindowsDriveMismatchError, WindowsPathTypeMismatchError, WindowsUNCShareMismatchError } from "./errors";
import { getAnyUNCRoot, getWindowsDriveLetter, toUNCPosix, toUnixFormat } from "./platform";
import { isCaseSensitive, isWindows } from "./utils";

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

  basePath = prependLeadingSlash(basePath);
  inputPath = prependLeadingSlash(inputPath);

  // normalize the base path to absolute form
  const normalizedBasePath = pathe.normalize(basePath);

  // decode the input path until there are no more encoded segments
  let decodedPath: string;
  try {
    decodedPath = decodePathSafely(inputPath);
  } catch {
    throw new FailedToDecodePathError();
  }

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
    return pathe.normalize(absoluteInputPath);
  }

  // Windows-specific handling for absolute Windows forms
  const baseIsDriveAbs = WINDOWS_DRIVE_RE.test(normalizedBasePath);
  const baseIsUNCAbs = WINDOWS_UNC_ROOT_RE.test(normalizedBasePath);

  // If the input path is a Windows absolute path, we need to handle it specially.
  if (WINDOWS_DRIVE_RE.test(decodedPath)) {
    // Input = absolute drive path like "C:\foo"
    const inputDrive = getWindowsDriveLetter(decodedPath);
    if (isWindows && baseIsDriveAbs) {
      const baseDrive = getWindowsDriveLetter(normalizedBasePath);
      if (baseDrive && inputDrive && baseDrive !== inputDrive) {
        throw new WindowsDriveMismatchError(baseDrive, inputDrive);
      }
    }
    if (isWindows && baseIsUNCAbs) {
      // Mixing absolute drive with UNC base → reject on Windows
      throw new WindowsPathTypeMismatchError("UNC", "drive-letter absolute");
    }

    // Sandbox: strip drive root and append to base
    const withoutPrefix = decodedPath.replace(WINDOWS_DRIVE_RE, "");
    const relativePath = trimLeadingSlash(withoutPrefix).replace(/\\/g, "/");
    resolvedPath = pathe.resolve(normalizedBasePath, relativePath);
  } else if (WINDOWS_UNC_ROOT_RE.test(decodedPath)) {
    // Input = absolute UNC like "\\server\share\..."
    const inputUNCRoot = getAnyUNCRoot(decodedPath);
    const baseUNCRoot = getAnyUNCRoot(normalizedBasePath);

    if (isWindows && baseIsUNCAbs) {
      // On Windows, enforce same-share for double-absolute UNC
      const sameShare = baseUNCRoot && inputUNCRoot
        && baseUNCRoot.toLowerCase() === inputUNCRoot.toLowerCase();
      if (!sameShare) {
        throw new WindowsUNCShareMismatchError(String(baseUNCRoot), String(inputUNCRoot));
      }
    }
    if (isWindows && baseIsDriveAbs) {
      // Mixing absolute UNC with drive base → reject on Windows
      throw new WindowsPathTypeMismatchError("drive-letter", "UNC absolute");
    }

    // Sandbox: strip the *matching* UNC root (if present) and append the tail to base
    const tail = inputUNCRoot
      ? trimLeadingSlash(decodedPath.slice(inputUNCRoot.length))
      : decodedPath.replace(/^\\+/, "");
    const relativePath = tail.replace(/\\/g, "/");
    resolvedPath = pathe.resolve(normalizedBasePath, relativePath);
  } else {
    const unixPath = toUnixFormat(decodedPath);

    if (pathe.isAbsolute(unixPath)) {
      resolvedPath = handleAbsolutePath(unixPath, normalizedBasePath);
    } else {
      resolvedPath = handleRelativePath(unixPath, normalizedBasePath);
    }
  }

  // final boundary validation
  if (!isWithinBase(resolvedPath, normalizedBasePath)) {
    throw new PathTraversalError(normalizedBasePath, resolvedPath);
  }

  // normalize to platform-native format for final output
  const normalized = pathe.normalize(resolvedPath);

  if (isUNCish(basePath) || isUNCish(inputPath) || isUNCish(normalized)) {
    throw new Error("UNC paths are not supported in this environment");
    return toUNCPosix(normalized);
  }

  return normalized;
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

function isUNCish(p: string): boolean {
  return WINDOWS_UNC_ROOT_RE.test(p) || /^\/\/[^/]+\/[^/]+/.test(p);
}
